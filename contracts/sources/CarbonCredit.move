module carbon_marketplace::carbon_credit {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_CREDIT_NOT_FOUND: u64 = 2;
    const E_CREDIT_ALREADY_RETIRED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_REGISTRY_NOT_INITIALIZED: u64 = 6;

    /// Carbon Credit NFT structure
    struct CarbonCredit has key, store, copy, drop {
        id: u64,
        project_id: String,
        vintage_year: u64,
        methodology: String,
        amount_tons: u64,
        verification_data_hash: vector<u8>,
        mint_timestamp: u64,
        retired: bool,
        owner: address,
        certifications: vector<String>
    }

    /// Credit registry to track all credits
    struct CreditRegistry has key {
        next_id: u64,
        total_credits_minted: u64,
        total_credits_retired: u64,
        admin: address,
        credits: Table<u64, CarbonCredit>,
        owner_credits: Table<address, vector<u64>>,
        credit_mint_events: EventHandle<CreditMinted>,
        credit_transfer_events: EventHandle<CreditTransferred>,
        credit_retirement_events: EventHandle<CreditRetired>
    }

    /// User's credit portfolio
    struct CreditPortfolio has key {
        owner: address,
        credit_ids: vector<u64>,
        total_balance: u64,
        retired_credits: vector<u64>
    }

    /// Verification data structure
    struct VerificationData has store, copy, drop {
        iot_data_hash: vector<u8>,
        ai_calculation_hash: vector<u8>,
        timestamp: u64,
        sensor_ids: vector<String>,
        confidence_score: u8,
        verification_level: u8
    }

    /// Events
    struct CreditMinted has drop, store {
        credit_id: u64,
        project_id: String,
        owner: address,
        amount_tons: u64,
        mint_timestamp: u64
    }

    struct CreditTransferred has drop, store {
        credit_id: u64,
        from: address,
        to: address,
        timestamp: u64
    }

    struct CreditRetired has drop, store {
        credit_id: u64,
        owner: address,
        retirement_reason: String,
        timestamp: u64,
        amount_tons: u64
    }

    /// Initialize the credit system
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        let registry = CreditRegistry {
            next_id: 1,
            total_credits_minted: 0,
            total_credits_retired: 0,
            admin: admin_addr,
            credits: table::new(),
            owner_credits: table::new(),
            credit_mint_events: account::new_event_handle<CreditMinted>(admin),
            credit_transfer_events: account::new_event_handle<CreditTransferred>(admin),
            credit_retirement_events: account::new_event_handle<CreditRetired>(admin)
        };

        move_to(admin, registry);
    }

    /// Mint new carbon credit
    public entry fun mint_credit(
        admin: &signer,
        recipient: address,
        project_id: String,
        vintage_year: u64,
        methodology: String,
        amount_tons: u64,
        verification_data_hash: vector<u8>
    ) acquires CreditRegistry, CreditPortfolio {
        let admin_addr = signer::address_of(admin);

        // Validate admin authorization
        assert!(exists<CreditRegistry>(admin_addr), E_REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global_mut<CreditRegistry>(admin_addr);
        assert!(registry.admin == admin_addr, E_NOT_AUTHORIZED);
        assert!(amount_tons > 0, E_INVALID_AMOUNT);

        let credit_id = registry.next_id;
        registry.next_id = credit_id + 1;
        registry.total_credits_minted = registry.total_credits_minted + amount_tons;

        let credit = CarbonCredit {
            id: credit_id,
            project_id,
            vintage_year,
            methodology,
            amount_tons,
            verification_data_hash,
            mint_timestamp: timestamp::now_seconds(),
            retired: false,
            owner: recipient,
            certifications: vector::empty()
        };

        // Store credit in registry
        table::add(&mut registry.credits, credit_id, copy credit);

        // Update owner's credit list
        if (!table::contains(&registry.owner_credits, recipient)) {
            table::add(&mut registry.owner_credits, recipient, vector::empty<u64>());
        };
        let owner_list = table::borrow_mut(&mut registry.owner_credits, recipient);
        vector::push_back(owner_list, credit_id);

        // Initialize or update recipient's portfolio
        if (!exists<CreditPortfolio>(recipient)) {
            let portfolio = CreditPortfolio {
                owner: recipient,
                credit_ids: vector::singleton(credit_id),
                total_balance: amount_tons,
                retired_credits: vector::empty()
            };
            move_to(admin, portfolio);
        } else {
            let portfolio = borrow_global_mut<CreditPortfolio>(recipient);
            vector::push_back(&mut portfolio.credit_ids, credit_id);
            portfolio.total_balance = portfolio.total_balance + amount_tons;
        };

        // Emit event
        event::emit_event(&mut registry.credit_mint_events, CreditMinted {
            credit_id,
            project_id,
            owner: recipient,
            amount_tons,
            mint_timestamp: timestamp::now_seconds()
        });
    }

    /// Transfer credit to new owner
    public entry fun transfer_credit(
        owner: &signer,
        credit_id: u64,
        new_owner: address
    ) acquires CreditRegistry, CreditPortfolio {
        let owner_addr = signer::address_of(owner);

        // Get registry
        let registry = borrow_global_mut<CreditRegistry>(@carbon_marketplace);

        // Validate credit exists and ownership
        assert!(table::contains(&registry.credits, credit_id), E_CREDIT_NOT_FOUND);
        let credit = table::borrow_mut(&mut registry.credits, credit_id);
        assert!(credit.owner == owner_addr, E_NOT_AUTHORIZED);
        assert!(!credit.retired, E_CREDIT_ALREADY_RETIRED);

        let amount_tons = credit.amount_tons;

        // Update credit ownership
        credit.owner = new_owner;

        // Update old owner's portfolio
        let old_portfolio = borrow_global_mut<CreditPortfolio>(owner_addr);
        let (found, index) = vector::index_of(&old_portfolio.credit_ids, &credit_id);
        if (found) {
            vector::remove(&mut old_portfolio.credit_ids, index);
            old_portfolio.total_balance = old_portfolio.total_balance - amount_tons;
        };

        // Update new owner's portfolio
        if (!exists<CreditPortfolio>(new_owner)) {
            let new_portfolio = CreditPortfolio {
                owner: new_owner,
                credit_ids: vector::singleton(credit_id),
                total_balance: amount_tons,
                retired_credits: vector::empty()
            };
            move_to(owner, new_portfolio);
        } else {
            let new_portfolio = borrow_global_mut<CreditPortfolio>(new_owner);
            vector::push_back(&mut new_portfolio.credit_ids, credit_id);
            new_portfolio.total_balance = new_portfolio.total_balance + amount_tons;
        };

        // Update registry owner tracking
        let old_owner_list = table::borrow_mut(&mut registry.owner_credits, owner_addr);
        let (found, index) = vector::index_of(old_owner_list, &credit_id);
        if (found) {
            vector::remove(old_owner_list, index);
        };

        if (!table::contains(&registry.owner_credits, new_owner)) {
            table::add(&mut registry.owner_credits, new_owner, vector::empty<u64>());
        };
        let new_owner_list = table::borrow_mut(&mut registry.owner_credits, new_owner);
        vector::push_back(new_owner_list, credit_id);

        // Emit event
        event::emit_event(&mut registry.credit_transfer_events, CreditTransferred {
            credit_id,
            from: owner_addr,
            to: new_owner,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Retire carbon credit permanently
    public entry fun retire_credit(
        owner: &signer,
        credit_id: u64,
        retirement_reason: String
    ) acquires CreditRegistry, CreditPortfolio {
        let owner_addr = signer::address_of(owner);

        // Get registry
        let registry = borrow_global_mut<CreditRegistry>(@carbon_marketplace);

        // Validate credit exists and ownership
        assert!(table::contains(&registry.credits, credit_id), E_CREDIT_NOT_FOUND);
        let credit = table::borrow_mut(&mut registry.credits, credit_id);
        assert!(credit.owner == owner_addr, E_NOT_AUTHORIZED);
        assert!(!credit.retired, E_CREDIT_ALREADY_RETIRED);

        let amount_tons = credit.amount_tons;

        // Mark credit as retired
        credit.retired = true;

        // Update registry statistics
        registry.total_credits_retired = registry.total_credits_retired + amount_tons;

        // Update owner's portfolio
        let portfolio = borrow_global_mut<CreditPortfolio>(owner_addr);
        let (found, index) = vector::index_of(&portfolio.credit_ids, &credit_id);
        if (found) {
            vector::remove(&mut portfolio.credit_ids, index);
            portfolio.total_balance = portfolio.total_balance - amount_tons;
            vector::push_back(&mut portfolio.retired_credits, credit_id);
        };

        // Emit event
        event::emit_event(&mut registry.credit_retirement_events, CreditRetired {
            credit_id,
            owner: owner_addr,
            retirement_reason,
            timestamp: timestamp::now_seconds(),
            amount_tons
        });
    }

    /// Get credit information
    public fun get_credit_info(credit_id: u64): (String, u64, u64, bool, address) acquires CreditRegistry {
        let registry = borrow_global<CreditRegistry>(@carbon_marketplace);
        assert!(table::contains(&registry.credits, credit_id), E_CREDIT_NOT_FOUND);

        let credit = table::borrow(&registry.credits, credit_id);
        (credit.project_id, credit.vintage_year, credit.amount_tons, credit.retired, credit.owner)
    }

    /// Get user's portfolio information
    public fun get_portfolio_info(owner: address): (u64, u64, vector<u64>) acquires CreditPortfolio {
        if (!exists<CreditPortfolio>(owner)) {
            return (0, 0, vector::empty())
        };

        let portfolio = borrow_global<CreditPortfolio>(owner);
        (
            portfolio.total_balance,
            vector::length(&portfolio.retired_credits),
            portfolio.credit_ids
        )
    }

    /// Get registry statistics
    public fun get_registry_stats(): (u64, u64, u64) acquires CreditRegistry {
        let registry = borrow_global<CreditRegistry>(@carbon_marketplace);
        (registry.total_credits_minted, registry.total_credits_retired, registry.next_id - 1)
    }

    /// Add certification to credit (admin only)
    public entry fun add_certification(
        admin: &signer,
        credit_id: u64,
        certification: String
    ) acquires CreditRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<CreditRegistry>(@carbon_marketplace);
        assert!(registry.admin == admin_addr, E_NOT_AUTHORIZED);
        assert!(table::contains(&registry.credits, credit_id), E_CREDIT_NOT_FOUND);

        let credit = table::borrow_mut(&mut registry.credits, credit_id);
        vector::push_back(&mut credit.certifications, certification);
    }

    /// Batch transfer multiple credits
    public entry fun batch_transfer(
        owner: &signer,
        credit_ids: vector<u64>,
        new_owner: address
    ) acquires CreditRegistry, CreditPortfolio {
        let i = 0;
        let len = vector::length(&credit_ids);
        while (i < len) {
            let credit_id = *vector::borrow(&credit_ids, i);
            transfer_credit(owner, credit_id, new_owner);
            i = i + 1;
        };
    }

    /// Batch retire multiple credits
    public entry fun batch_retire(
        owner: &signer,
        credit_ids: vector<u64>,
        retirement_reason: String
    ) acquires CreditRegistry, CreditPortfolio {
        let i = 0;
        let len = vector::length(&credit_ids);
        while (i < len) {
            let credit_id = *vector::borrow(&credit_ids, i);
            retire_credit(owner, credit_id, retirement_reason);
            i = i + 1;
        };
    }

    #[view]
    public fun is_credit_retired(credit_id: u64): bool acquires CreditRegistry {
        let registry = borrow_global<CreditRegistry>(@carbon_marketplace);
        if (!table::contains(&registry.credits, credit_id)) {
            return false
        };
        let credit = table::borrow(&registry.credits, credit_id);
        credit.retired
    }

    #[view]
    public fun get_credit_owner(credit_id: u64): Option<address> acquires CreditRegistry {
        let registry = borrow_global<CreditRegistry>(@carbon_marketplace);
        if (!table::contains(&registry.credits, credit_id)) {
            return option::none()
        };
        let credit = table::borrow(&registry.credits, credit_id);
        option::some(credit.owner)
    }
}