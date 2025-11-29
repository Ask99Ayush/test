module carbon_marketplace::marketplace {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::table::{Self, Table};
    use carbon_marketplace::carbon_credit;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_ORDER_NOT_FOUND: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    const E_ORDER_ALREADY_FILLED: u64 = 4;
    const E_INVALID_PRICE: u64 = 5;
    const E_INVALID_QUANTITY: u64 = 6;
    const E_MARKETPLACE_NOT_INITIALIZED: u64 = 7;
    const E_CANNOT_MATCH_OWN_ORDER: u64 = 8;
    const E_CREDIT_NOT_AVAILABLE: u64 = 9;

    /// Order types
    const ORDER_TYPE_BUY: u8 = 1;
    const ORDER_TYPE_SELL: u8 = 2;

    /// Order status
    const ORDER_STATUS_OPEN: u8 = 1;
    const ORDER_STATUS_FILLED: u8 = 2;
    const ORDER_STATUS_PARTIALLY_FILLED: u8 = 3;
    const ORDER_STATUS_CANCELLED: u8 = 4;

    /// Buy order structure
    struct BuyOrder has store, copy, drop {
        id: u64,
        buyer: address,
        price_per_ton: u64,
        quantity_tons: u64,
        filled_quantity: u64,
        escrow_amount: u64,
        timestamp: u64,
        status: u8,
        project_filter: Option<String>
    }

    /// Sell order structure
    struct SellOrder has store, copy, drop {
        id: u64,
        seller: address,
        credit_ids: vector<u64>,
        price_per_ton: u64,
        quantity_tons: u64,
        filled_quantity: u64,
        timestamp: u64,
        status: u8
    }

    /// Order book structure
    struct OrderBook has key {
        next_order_id: u64,
        buy_orders: Table<u64, BuyOrder>,
        sell_orders: Table<u64, SellOrder>,
        user_buy_orders: Table<address, vector<u64>>,
        user_sell_orders: Table<address, vector<u64>>,
        total_volume_traded: u64,
        total_fees_collected: u64,
        fee_rate: u64,  // Fee rate in basis points (100 = 1%)
        admin: address,
        escrow_vault: Coin<AptosCoin>,
        order_placed_events: EventHandle<OrderPlaced>,
        trade_executed_events: EventHandle<TradeExecuted>,
        order_cancelled_events: EventHandle<OrderCancelled>
    }

    /// Trade execution event
    struct TradeExecuted has drop, store {
        buy_order_id: u64,
        sell_order_id: u64,
        buyer: address,
        seller: address,
        credit_ids: vector<u64>,
        price_per_ton: u64,
        quantity_tons: u64,
        total_price: u64,
        fee_amount: u64,
        timestamp: u64
    }

    /// Order placed event
    struct OrderPlaced has drop, store {
        order_id: u64,
        order_type: u8,
        creator: address,
        price_per_ton: u64,
        quantity_tons: u64,
        timestamp: u64
    }

    /// Order cancelled event
    struct OrderCancelled has drop, store {
        order_id: u64,
        order_type: u8,
        creator: address,
        timestamp: u64
    }

    /// Price history entry
    struct PriceHistory has store, copy, drop {
        price: u64,
        volume: u64,
        timestamp: u64
    }

    /// Market statistics
    struct MarketStats has key {
        last_price: u64,
        daily_volume: u64,
        daily_high: u64,
        daily_low: u64,
        price_history: vector<PriceHistory>
    }

    /// Initialize marketplace
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        let order_book = OrderBook {
            next_order_id: 1,
            buy_orders: table::new(),
            sell_orders: table::new(),
            user_buy_orders: table::new(),
            user_sell_orders: table::new(),
            total_volume_traded: 0,
            total_fees_collected: 0,
            fee_rate: 250,  // 2.5% fee
            admin: admin_addr,
            escrow_vault: coin::zero<AptosCoin>(),
            order_placed_events: account::new_event_handle<OrderPlaced>(admin),
            trade_executed_events: account::new_event_handle<TradeExecuted>(admin),
            order_cancelled_events: account::new_event_handle<OrderCancelled>(admin)
        };

        let market_stats = MarketStats {
            last_price: 0,
            daily_volume: 0,
            daily_high: 0,
            daily_low: 0,
            price_history: vector::empty()
        };

        move_to(admin, order_book);
        move_to(admin, market_stats);
    }

    /// Place buy order with escrow
    public entry fun place_buy_order(
        buyer: &signer,
        price_per_ton: u64,
        quantity_tons: u64,
        project_filter: Option<String>,
        payment: Coin<AptosCoin>
    ) acquires OrderBook {
        let buyer_addr = signer::address_of(buyer);
        assert!(price_per_ton > 0, E_INVALID_PRICE);
        assert!(quantity_tons > 0, E_INVALID_QUANTITY);

        let order_book = borrow_global_mut<OrderBook>(@carbon_marketplace);
        let order_id = order_book.next_order_id;
        order_book.next_order_id = order_id + 1;

        let total_cost = price_per_ton * quantity_tons;
        let fee_amount = (total_cost * order_book.fee_rate) / 10000;
        let required_amount = total_cost + fee_amount;

        // Verify sufficient payment
        assert!(coin::value(&payment) >= required_amount, E_INSUFFICIENT_FUNDS);

        // Add to escrow
        coin::merge(&mut order_book.escrow_vault, payment);

        let buy_order = BuyOrder {
            id: order_id,
            buyer: buyer_addr,
            price_per_ton,
            quantity_tons,
            filled_quantity: 0,
            escrow_amount: required_amount,
            timestamp: timestamp::now_seconds(),
            status: ORDER_STATUS_OPEN,
            project_filter
        };

        // Store order
        table::add(&mut order_book.buy_orders, order_id, buy_order);

        // Update user's order tracking
        if (!table::contains(&order_book.user_buy_orders, buyer_addr)) {
            table::add(&mut order_book.user_buy_orders, buyer_addr, vector::empty<u64>());
        };
        let user_orders = table::borrow_mut(&mut order_book.user_buy_orders, buyer_addr);
        vector::push_back(user_orders, order_id);

        // Try to match with existing sell orders
        try_match_buy_order(order_book, order_id);

        // Emit event
        event::emit_event(&mut order_book.order_placed_events, OrderPlaced {
            order_id,
            order_type: ORDER_TYPE_BUY,
            creator: buyer_addr,
            price_per_ton,
            quantity_tons,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Place sell order
    public entry fun place_sell_order(
        seller: &signer,
        credit_ids: vector<u64>,
        price_per_ton: u64
    ) acquires OrderBook {
        let seller_addr = signer::address_of(seller);
        assert!(price_per_ton > 0, E_INVALID_PRICE);
        assert!(!vector::is_empty(&credit_ids), E_INVALID_QUANTITY);

        // Validate ownership and calculate total quantity
        let i = 0;
        let len = vector::length(&credit_ids);
        let total_quantity = 0;

        while (i < len) {
            let credit_id = *vector::borrow(&credit_ids, i);

            // Check if credit exists and is owned by seller
            let owner_option = carbon_credit::get_credit_owner(credit_id);
            assert!(option::is_some(&owner_option), E_CREDIT_NOT_AVAILABLE);
            assert!(option::extract(&mut owner_option) == seller_addr, E_NOT_AUTHORIZED);

            // Check if credit is not retired
            assert!(!carbon_credit::is_credit_retired(credit_id), E_CREDIT_NOT_AVAILABLE);

            // Get credit info and add to total quantity
            let (_, _, amount_tons, _, _) = carbon_credit::get_credit_info(credit_id);
            total_quantity = total_quantity + amount_tons;

            i = i + 1;
        };

        let order_book = borrow_global_mut<OrderBook>(@carbon_marketplace);
        let order_id = order_book.next_order_id;
        order_book.next_order_id = order_id + 1;

        let sell_order = SellOrder {
            id: order_id,
            seller: seller_addr,
            credit_ids,
            price_per_ton,
            quantity_tons: total_quantity,
            filled_quantity: 0,
            timestamp: timestamp::now_seconds(),
            status: ORDER_STATUS_OPEN
        };

        // Store order
        table::add(&mut order_book.sell_orders, order_id, sell_order);

        // Update user's order tracking
        if (!table::contains(&order_book.user_sell_orders, seller_addr)) {
            table::add(&mut order_book.user_sell_orders, seller_addr, vector::empty<u64>());
        };
        let user_orders = table::borrow_mut(&mut order_book.user_sell_orders, seller_addr);
        vector::push_back(user_orders, order_id);

        // Try to match with existing buy orders
        try_match_sell_order(order_book, order_id);

        // Emit event
        event::emit_event(&mut order_book.order_placed_events, OrderPlaced {
            order_id,
            order_type: ORDER_TYPE_SELL,
            creator: seller_addr,
            price_per_ton,
            quantity_tons: total_quantity,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Execute manual trade between specific orders
    public entry fun execute_trade(
        executor: &signer,
        buy_order_id: u64,
        sell_order_id: u64
    ) acquires OrderBook, MarketStats {
        let order_book = borrow_global_mut<OrderBook>(@carbon_marketplace);

        // Validate orders exist
        assert!(table::contains(&order_book.buy_orders, buy_order_id), E_ORDER_NOT_FOUND);
        assert!(table::contains(&order_book.sell_orders, sell_order_id), E_ORDER_NOT_FOUND);

        let buy_order = table::borrow(&order_book.buy_orders, buy_order_id);
        let sell_order = table::borrow(&order_book.sell_orders, sell_order_id);

        // Validate orders are still open
        assert!(buy_order.status == ORDER_STATUS_OPEN, E_ORDER_ALREADY_FILLED);
        assert!(sell_order.status == ORDER_STATUS_OPEN, E_ORDER_ALREADY_FILLED);

        // Validate price compatibility
        assert!(buy_order.price_per_ton >= sell_order.price_per_ton, E_INVALID_PRICE);

        // Validate users cannot trade with themselves
        assert!(buy_order.buyer != sell_order.seller, E_CANNOT_MATCH_OWN_ORDER);

        execute_trade_internal(order_book, buy_order_id, sell_order_id);
    }

    /// Internal function to execute trade
    fun execute_trade_internal(
        order_book: &mut OrderBook,
        buy_order_id: u64,
        sell_order_id: u64
    ) acquires MarketStats {
        let buy_order = table::borrow_mut(&mut order_book.buy_orders, buy_order_id);
        let sell_order = table::borrow_mut(&mut order_book.sell_orders, sell_order_id);

        // Calculate trade quantity (minimum of remaining quantities)
        let buy_remaining = buy_order.quantity_tons - buy_order.filled_quantity;
        let sell_remaining = sell_order.quantity_tons - sell_order.filled_quantity;
        let trade_quantity = if (buy_remaining < sell_remaining) { buy_remaining } else { sell_remaining };

        // Calculate trade price (use seller's price)
        let trade_price = sell_order.price_per_ton;
        let total_price = trade_price * trade_quantity;
        let fee_amount = (total_price * order_book.fee_rate) / 10000;

        // Extract payment from escrow
        let payment = coin::extract(&mut order_book.escrow_vault, total_price + fee_amount);
        let seller_payment = coin::extract(&mut payment, total_price);
        let fee_payment = payment; // Remaining amount is the fee

        // Transfer credits from seller to buyer
        let credits_to_transfer = get_credits_for_quantity(sell_order, trade_quantity);

        // Transfer each credit
        let i = 0;
        let len = vector::length(&credits_to_transfer);
        while (i < len) {
            let credit_id = *vector::borrow(&credits_to_transfer, i);
            // Note: In real implementation, need proper signer for transfer
            // This is a simplified version
            i = i + 1;
        };

        // Update order quantities
        buy_order.filled_quantity = buy_order.filled_quantity + trade_quantity;
        sell_order.filled_quantity = sell_order.filled_quantity + trade_quantity;

        // Update order status
        if (buy_order.filled_quantity == buy_order.quantity_tons) {
            buy_order.status = ORDER_STATUS_FILLED;
        } else {
            buy_order.status = ORDER_STATUS_PARTIALLY_FILLED;
        };

        if (sell_order.filled_quantity == sell_order.quantity_tons) {
            sell_order.status = ORDER_STATUS_FILLED;
        } else {
            sell_order.status = ORDER_STATUS_PARTIALLY_FILLED;
        };

        // Update marketplace statistics
        order_book.total_volume_traded = order_book.total_volume_traded + trade_quantity;
        order_book.total_fees_collected = order_book.total_fees_collected + fee_amount;

        // Update market stats
        update_market_stats(trade_price, trade_quantity);

        // Pay seller (simplified - in real implementation, need proper coin transfer)
        coin::merge(&mut order_book.escrow_vault, seller_payment);
        coin::merge(&mut order_book.escrow_vault, fee_payment);

        // Emit trade event
        event::emit_event(&mut order_book.trade_executed_events, TradeExecuted {
            buy_order_id,
            sell_order_id,
            buyer: buy_order.buyer,
            seller: sell_order.seller,
            credit_ids: credits_to_transfer,
            price_per_ton: trade_price,
            quantity_tons: trade_quantity,
            total_price,
            fee_amount,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Cancel order
    public entry fun cancel_order(
        user: &signer,
        order_id: u64,
        order_type: u8
    ) acquires OrderBook {
        let user_addr = signer::address_of(user);
        let order_book = borrow_global_mut<OrderBook>(@carbon_marketplace);

        if (order_type == ORDER_TYPE_BUY) {
            assert!(table::contains(&order_book.buy_orders, order_id), E_ORDER_NOT_FOUND);
            let buy_order = table::borrow_mut(&mut order_book.buy_orders, order_id);
            assert!(buy_order.buyer == user_addr, E_NOT_AUTHORIZED);
            assert!(buy_order.status == ORDER_STATUS_OPEN, E_ORDER_ALREADY_FILLED);

            // Return escrowed funds
            let refund_amount = buy_order.escrow_amount;
            let refund = coin::extract(&mut order_book.escrow_vault, refund_amount);
            // In real implementation, transfer refund to user

            buy_order.status = ORDER_STATUS_CANCELLED;
        } else {
            assert!(table::contains(&order_book.sell_orders, order_id), E_ORDER_NOT_FOUND);
            let sell_order = table::borrow_mut(&mut order_book.sell_orders, order_id);
            assert!(sell_order.seller == user_addr, E_NOT_AUTHORIZED);
            assert!(sell_order.status == ORDER_STATUS_OPEN, E_ORDER_ALREADY_FILLED);

            sell_order.status = ORDER_STATUS_CANCELLED;
        };

        // Emit cancellation event
        event::emit_event(&mut order_book.order_cancelled_events, OrderCancelled {
            order_id,
            order_type,
            creator: user_addr,
            timestamp: timestamp::now_seconds()
        });
    }

    /// Helper function to match buy orders
    fun try_match_buy_order(order_book: &mut OrderBook, buy_order_id: u64) acquires MarketStats {
        // Implementation would iterate through sell orders to find matches
        // For brevity, this is a simplified version
    }

    /// Helper function to match sell orders
    fun try_match_sell_order(order_book: &mut OrderBook, sell_order_id: u64) acquires MarketStats {
        // Implementation would iterate through buy orders to find matches
        // For brevity, this is a simplified version
    }

    /// Helper function to get credits for trade quantity
    fun get_credits_for_quantity(sell_order: &SellOrder, quantity: u64): vector<u64> {
        // Implementation would select appropriate credits from the sell order
        // For brevity, return simplified result
        vector::empty<u64>()
    }

    /// Update market statistics
    fun update_market_stats(price: u64, volume: u64) acquires MarketStats {
        let stats = borrow_global_mut<MarketStats>(@carbon_marketplace);

        stats.last_price = price;
        stats.daily_volume = stats.daily_volume + volume;

        if (stats.daily_high < price) {
            stats.daily_high = price;
        };

        if (stats.daily_low == 0 || stats.daily_low > price) {
            stats.daily_low = price;
        };

        // Add to price history
        vector::push_back(&mut stats.price_history, PriceHistory {
            price,
            volume,
            timestamp: timestamp::now_seconds()
        });

        // Keep only last 1000 entries
        if (vector::length(&stats.price_history) > 1000) {
            vector::remove(&mut stats.price_history, 0);
        };
    }

    /// Get order book statistics
    #[view]
    public fun get_order_book_stats(): (u64, u64, u64, u64) acquires OrderBook {
        let order_book = borrow_global<OrderBook>(@carbon_marketplace);
        (
            table::length(&order_book.buy_orders),
            table::length(&order_book.sell_orders),
            order_book.total_volume_traded,
            order_book.total_fees_collected
        )
    }

    /// Get market statistics
    #[view]
    public fun get_market_stats(): (u64, u64, u64, u64) acquires MarketStats {
        let stats = borrow_global<MarketStats>(@carbon_marketplace);
        (stats.last_price, stats.daily_volume, stats.daily_high, stats.daily_low)
    }

    /// Get user's active buy orders
    #[view]
    public fun get_user_buy_orders(user: address): vector<u64> acquires OrderBook {
        let order_book = borrow_global<OrderBook>(@carbon_marketplace);
        if (!table::contains(&order_book.user_buy_orders, user)) {
            return vector::empty()
        };
        *table::borrow(&order_book.user_buy_orders, user)
    }

    /// Get user's active sell orders
    #[view]
    public fun get_user_sell_orders(user: address): vector<u64> acquires OrderBook {
        let order_book = borrow_global<OrderBook>(@carbon_marketplace);
        if (!table::contains(&order_book.user_sell_orders, user)) {
            return vector::empty()
        };
        *table::borrow(&order_book.user_sell_orders, user)
    }
}