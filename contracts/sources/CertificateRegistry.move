module carbon_marketplace::certificate_registry {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    use aptos_std::crypto_algebra;
    use aptos_std::bcs;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_CERTIFICATE_NOT_FOUND: u64 = 2;
    const E_INVALID_CERTIFICATE: u64 = 3;
    const E_CERTIFICATE_ALREADY_EXISTS: u64 = 4;
    const E_INVALID_SIGNATURE: u64 = 5;
    const E_CERTIFICATE_EXPIRED: u64 = 6;

    /// Certificate types
    const CERT_TYPE_PURCHASE: u8 = 1;
    const CERT_TYPE_RETIREMENT: u8 = 2;
    const CERT_TYPE_VERIFICATION: u8 = 3;
    const CERT_TYPE_COMPLIANCE: u8 = 4;
    const CERT_TYPE_AUDIT: u8 = 5;

    /// Certificate status
    const CERT_STATUS_ACTIVE: u8 = 1;
    const CERT_STATUS_EXPIRED: u8 = 2;
    const CERT_STATUS_REVOKED: u8 = 3;

    /// Certificate structure
    struct Certificate has key, store, copy, drop {
        id: u64,
        certificate_type: u8,
        recipient: address,
        credit_ids: vector<u64>,
        verification_data_hash: vector<u8>,
        issue_timestamp: u64,
        expiry_timestamp: Option<u64>,
        issuer: address,
        metadata: String,
        signature: vector<u8>,
        status: u8,
        audit_trail: vector<AuditEntry>
    }

    /// Audit trail entry
    struct AuditEntry has store, copy, drop {
        action: String,
        actor: address,
        timestamp: u64,
        details: String
    }

    /// Certificate template for standardization
    struct CertificateTemplate has store, copy, drop {
        template_id: String,
        template_name: String,
        certificate_type: u8,
        validity_period_days: Option<u64>,
        required_fields: vector<String>,
        template_data: String
    }

    /// Certificate registry
    struct CertificateRegistry has key {
        next_certificate_id: u64,
        total_certificates_issued: u64,
        certificates: Table<u64, Certificate>,
        user_certificates: Table<address, vector<u64>>,
        certificate_lookup: Table<vector<u8>, u64>, // Hash -> Certificate ID
        authorized_issuers: vector<address>,
        certificate_templates: Table<String, CertificateTemplate>,
        admin: address,
        certificate_issued_events: EventHandle<CertificateIssued>,
        certificate_verified_events: EventHandle<CertificateVerified>,
        certificate_revoked_events: EventHandle<CertificateRevoked>
    }

    /// Certificate issued event
    struct CertificateIssued has drop, store {
        certificate_id: u64,
        certificate_type: u8,
        recipient: address,
        issuer: address,
        credit_ids: vector<u64>,
        timestamp: u64
    }

    /// Certificate verified event
    struct CertificateVerified has drop, store {
        certificate_id: u64,
        verifier: address,
        verification_result: bool,
        timestamp: u64
    }

    /// Certificate revoked event
    struct CertificateRevoked has drop, store {
        certificate_id: u64,
        revoker: address,
        reason: String,
        timestamp: u64
    }

    /// Verification result structure
    struct VerificationResult has copy, drop {
        is_valid: bool,
        certificate_id: u64,
        issue_date: u64,
        expiry_date: Option<u64>,
        status: u8,
        verification_timestamp: u64
    }

    /// Initialize certificate registry
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        let registry = CertificateRegistry {
            next_certificate_id: 1,
            total_certificates_issued: 0,
            certificates: table::new(),
            user_certificates: table::new(),
            certificate_lookup: table::new(),
            authorized_issuers: vector::singleton(admin_addr),
            certificate_templates: table::new(),
            admin: admin_addr,
            certificate_issued_events: account::new_event_handle<CertificateIssued>(admin),
            certificate_verified_events: account::new_event_handle<CertificateVerified>(admin),
            certificate_revoked_events: account::new_event_handle<CertificateRevoked>(admin)
        };

        move_to(admin, registry);

        // Initialize standard certificate templates
        initialize_standard_templates(&mut registry);
    }

    /// Issue new certificate
    public entry fun issue_certificate(
        issuer: &signer,
        recipient: address,
        certificate_type: u8,
        credit_ids: vector<u64>,
        verification_data_hash: vector<u8>,
        metadata: String,
        validity_days: Option<u64>
    ) acquires CertificateRegistry {
        let issuer_addr = signer::address_of(issuer);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        // Verify issuer authorization
        assert!(
            vector::contains(&registry.authorized_issuers, &issuer_addr) || issuer_addr == registry.admin,
            E_NOT_AUTHORIZED
        );

        let certificate_id = registry.next_certificate_id;
        registry.next_certificate_id = certificate_id + 1;
        registry.total_certificates_issued = registry.total_certificates_issued + 1;

        let current_time = timestamp::now_seconds();
        let expiry_timestamp = if (option::is_some(&validity_days)) {
            let days = option::extract(&mut validity_days);
            option::some(current_time + (days * 24 * 60 * 60))
        } else {
            option::none()
        };

        // Generate certificate signature
        let signature = generate_certificate_signature(
            certificate_id,
            certificate_type,
            recipient,
            &verification_data_hash,
            current_time
        );

        // Create initial audit entry
        let initial_audit = AuditEntry {
            action: string::utf8(b"ISSUED"),
            actor: issuer_addr,
            timestamp: current_time,
            details: string::utf8(b"Certificate issued")
        };

        let certificate = Certificate {
            id: certificate_id,
            certificate_type,
            recipient,
            credit_ids,
            verification_data_hash,
            issue_timestamp: current_time,
            expiry_timestamp,
            issuer: issuer_addr,
            metadata,
            signature,
            status: CERT_STATUS_ACTIVE,
            audit_trail: vector::singleton(initial_audit)
        };

        // Store certificate
        table::add(&mut registry.certificates, certificate_id, certificate);

        // Update recipient's certificate list
        if (!table::contains(&registry.user_certificates, recipient)) {
            table::add(&mut registry.user_certificates, recipient, vector::empty<u64>());
        };
        let user_certs = table::borrow_mut(&mut registry.user_certificates, recipient);
        vector::push_back(user_certs, certificate_id);

        // Create lookup entry
        let cert_hash = generate_certificate_hash(&certificate);
        table::add(&mut registry.certificate_lookup, cert_hash, certificate_id);

        // Emit event
        event::emit_event(&mut registry.certificate_issued_events, CertificateIssued {
            certificate_id,
            certificate_type,
            recipient,
            issuer: issuer_addr,
            credit_ids,
            timestamp: current_time
        });
    }

    /// Verify certificate authenticity
    public entry fun verify_certificate(
        verifier: &signer,
        certificate_id: u64
    ): VerificationResult acquires CertificateRegistry {
        let verifier_addr = signer::address_of(verifier);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        assert!(table::contains(&registry.certificates, certificate_id), E_CERTIFICATE_NOT_FOUND);

        let certificate = table::borrow_mut(&mut registry.certificates, certificate_id);
        let current_time = timestamp::now_seconds();

        // Check certificate status
        let is_active = certificate.status == CERT_STATUS_ACTIVE;

        // Check expiry
        let is_not_expired = if (option::is_some(&certificate.expiry_timestamp)) {
            let expiry = option::extract(&mut certificate.expiry_timestamp);
            current_time <= expiry
        } else {
            true
        };

        // Verify signature
        let expected_signature = generate_certificate_signature(
            certificate.id,
            certificate.certificate_type,
            certificate.recipient,
            &certificate.verification_data_hash,
            certificate.issue_timestamp
        );
        let signature_valid = certificate.signature == expected_signature;

        let is_valid = is_active && is_not_expired && signature_valid;

        // Add verification audit entry
        let audit_entry = AuditEntry {
            action: string::utf8(b"VERIFIED"),
            actor: verifier_addr,
            timestamp: current_time,
            details: if (is_valid) {
                string::utf8(b"Verification successful")
            } else {
                string::utf8(b"Verification failed")
            }
        };
        vector::push_back(&mut certificate.audit_trail, audit_entry);

        // Update expiry status if needed
        if (!is_not_expired && certificate.status == CERT_STATUS_ACTIVE) {
            certificate.status = CERT_STATUS_EXPIRED;
        };

        let result = VerificationResult {
            is_valid,
            certificate_id,
            issue_date: certificate.issue_timestamp,
            expiry_date: certificate.expiry_timestamp,
            status: certificate.status,
            verification_timestamp: current_time
        };

        // Emit verification event
        event::emit_event(&mut registry.certificate_verified_events, CertificateVerified {
            certificate_id,
            verifier: verifier_addr,
            verification_result: is_valid,
            timestamp: current_time
        });

        result
    }

    /// Revoke certificate
    public entry fun revoke_certificate(
        revoker: &signer,
        certificate_id: u64,
        reason: String
    ) acquires CertificateRegistry {
        let revoker_addr = signer::address_of(revoker);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        assert!(table::contains(&registry.certificates, certificate_id), E_CERTIFICATE_NOT_FOUND);

        let certificate = table::borrow_mut(&mut registry.certificates, certificate_id);

        // Only issuer or admin can revoke
        assert!(
            certificate.issuer == revoker_addr || registry.admin == revoker_addr,
            E_NOT_AUTHORIZED
        );

        // Update status
        certificate.status = CERT_STATUS_REVOKED;

        // Add audit entry
        let audit_entry = AuditEntry {
            action: string::utf8(b"REVOKED"),
            actor: revoker_addr,
            timestamp: timestamp::now_seconds(),
            details: reason
        };
        vector::push_back(&mut certificate.audit_trail, audit_entry);

        // Emit event
        event::emit_event(&mut registry.certificate_revoked_events, CertificateRevoked {
            certificate_id,
            revoker: revoker_addr,
            reason,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Batch verify multiple certificates
    public fun batch_verify_certificates(
        verifier: &signer,
        certificate_ids: vector<u64>
    ): vector<VerificationResult> acquires CertificateRegistry {
        let results = vector::empty<VerificationResult>();
        let i = 0;
        let len = vector::length(&certificate_ids);

        while (i < len) {
            let cert_id = *vector::borrow(&certificate_ids, i);
            let result = verify_certificate(verifier, cert_id);
            vector::push_back(&mut results, result);
            i = i + 1;
        };

        results
    }

    /// Get certificate details
    #[view]
    public fun get_certificate_info(
        certificate_id: u64
    ): (u8, address, vector<u64>, u64, Option<u64>, u8) acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@carbon_marketplace);
        assert!(table::contains(&registry.certificates, certificate_id), E_CERTIFICATE_NOT_FOUND);

        let certificate = table::borrow(&registry.certificates, certificate_id);
        (
            certificate.certificate_type,
            certificate.recipient,
            certificate.credit_ids,
            certificate.issue_timestamp,
            certificate.expiry_timestamp,
            certificate.status
        )
    }

    /// Get user's certificates
    #[view]
    public fun get_user_certificates(user: address): vector<u64> acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@carbon_marketplace);
        if (!table::contains(&registry.user_certificates, user)) {
            return vector::empty()
        };
        *table::borrow(&registry.user_certificates, user)
    }

    /// Get certificate audit trail
    #[view]
    public fun get_certificate_audit_trail(certificate_id: u64): vector<AuditEntry> acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@carbon_marketplace);
        assert!(table::contains(&registry.certificates, certificate_id), E_CERTIFICATE_NOT_FOUND);

        let certificate = table::borrow(&registry.certificates, certificate_id);
        certificate.audit_trail
    }

    /// Add authorized issuer (admin only)
    public entry fun add_authorized_issuer(
        admin: &signer,
        new_issuer: address
    ) acquires CertificateRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        assert!(registry.admin == admin_addr, E_NOT_AUTHORIZED);

        if (!vector::contains(&registry.authorized_issuers, &new_issuer)) {
            vector::push_back(&mut registry.authorized_issuers, new_issuer);
        };
    }

    /// Remove authorized issuer (admin only)
    public entry fun remove_authorized_issuer(
        admin: &signer,
        issuer_to_remove: address
    ) acquires CertificateRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        assert!(registry.admin == admin_addr, E_NOT_AUTHORIZED);

        let (found, index) = vector::index_of(&registry.authorized_issuers, &issuer_to_remove);
        if (found) {
            vector::remove(&mut registry.authorized_issuers, index);
        };
    }

    /// Create certificate template
    public entry fun create_certificate_template(
        admin: &signer,
        template_id: String,
        template_name: String,
        certificate_type: u8,
        validity_period_days: Option<u64>,
        required_fields: vector<String>,
        template_data: String
    ) acquires CertificateRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<CertificateRegistry>(@carbon_marketplace);

        assert!(registry.admin == admin_addr, E_NOT_AUTHORIZED);

        let template = CertificateTemplate {
            template_id,
            template_name,
            certificate_type,
            validity_period_days,
            required_fields,
            template_data
        };

        table::add(&mut registry.certificate_templates, template_id, template);
    }

    /// Generate certificate signature
    fun generate_certificate_signature(
        certificate_id: u64,
        certificate_type: u8,
        recipient: address,
        verification_data_hash: &vector<u8>,
        timestamp: u64
    ): vector<u8> {
        let signature_data = vector::empty<u8>();
        vector::append(&mut signature_data, bcs::to_bytes(&certificate_id));
        vector::append(&mut signature_data, bcs::to_bytes(&certificate_type));
        vector::append(&mut signature_data, bcs::to_bytes(&recipient));
        vector::append(&mut signature_data, *verification_data_hash);
        vector::append(&mut signature_data, bcs::to_bytes(&timestamp));

        // In a real implementation, this would use cryptographic signing
        // For now, return a hash of the data
        aptos_std::aptos_hash::sha3_256(signature_data)
    }

    /// Generate certificate hash for lookup
    fun generate_certificate_hash(certificate: &Certificate): vector<u8> {
        let hash_data = vector::empty<u8>();
        vector::append(&mut hash_data, bcs::to_bytes(&certificate.id));
        vector::append(&mut hash_data, bcs::to_bytes(&certificate.recipient));
        vector::append(&mut hash_data, bcs::to_bytes(&certificate.issue_timestamp));

        aptos_std::aptos_hash::sha3_256(hash_data)
    }

    /// Initialize standard certificate templates
    fun initialize_standard_templates(registry: &mut CertificateRegistry) {
        // Purchase certificate template
        let purchase_template = CertificateTemplate {
            template_id: string::utf8(b"PURCHASE_TEMPLATE"),
            template_name: string::utf8(b"Carbon Credit Purchase Certificate"),
            certificate_type: CERT_TYPE_PURCHASE,
            validity_period_days: option::none(),
            required_fields: vector::empty(),
            template_data: string::utf8(b"{\"title\": \"Carbon Credit Purchase Certificate\", \"description\": \"This certificate confirms the purchase of carbon credits.\"}")
        };
        table::add(&mut registry.certificate_templates, string::utf8(b"PURCHASE_TEMPLATE"), purchase_template);

        // Retirement certificate template
        let retirement_template = CertificateTemplate {
            template_id: string::utf8(b"RETIREMENT_TEMPLATE"),
            template_name: string::utf8(b"Carbon Credit Retirement Certificate"),
            certificate_type: CERT_TYPE_RETIREMENT,
            validity_period_days: option::none(),
            required_fields: vector::empty(),
            template_data: string::utf8(b"{\"title\": \"Carbon Credit Retirement Certificate\", \"description\": \"This certificate confirms the retirement of carbon credits for offsetting purposes.\"}")
        };
        table::add(&mut registry.certificate_templates, string::utf8(b"RETIREMENT_TEMPLATE"), retirement_template);

        // Verification certificate template
        let verification_template = CertificateTemplate {
            template_id: string::utf8(b"VERIFICATION_TEMPLATE"),
            template_name: string::utf8(b"IoT Verification Certificate"),
            certificate_type: CERT_TYPE_VERIFICATION,
            validity_period_days: option::some(365), // Valid for 1 year
            required_fields: vector::empty(),
            template_data: string::utf8(b"{\"title\": \"IoT Verification Certificate\", \"description\": \"This certificate confirms the IoT verification of environmental data.\"}")
        };
        table::add(&mut registry.certificate_templates, string::utf8(b"VERIFICATION_TEMPLATE"), verification_template);
    }

    /// Get registry statistics
    #[view]
    public fun get_registry_stats(): (u64, u64, u64) acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@carbon_marketplace);
        (
            registry.total_certificates_issued,
            table::length(&registry.certificates),
            vector::length(&registry.authorized_issuers)
        )
    }
}