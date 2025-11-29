module carbon_marketplace::reputation {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    use aptos_std::math64;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_PROFILE_NOT_FOUND: u64 = 2;
    const E_INVALID_SCORE: u64 = 3;
    const E_INVALID_RATING: u64 = 4;
    const E_CANNOT_REVIEW_SELF: u64 = 5;
    const E_DUPLICATE_REVIEW: u64 = 6;

    /// Reputation categories
    const REP_PERFORMANCE: u8 = 1;
    const REP_DATA_QUALITY: u8 = 2;
    const REP_DELIVERY: u8 = 3;
    const REP_COMMUNITY: u8 = 4;
    const REP_COMPLIANCE: u8 = 5;

    /// User types
    const USER_TYPE_COMPANY: u8 = 1;
    const USER_TYPE_PROJECT_DEVELOPER: u8 = 2;
    const USER_TYPE_AUDITOR: u8 = 3;
    const USER_TYPE_MARKETPLACE: u8 = 4;

    /// Review status
    const REVIEW_STATUS_PENDING: u8 = 1;
    const REVIEW_STATUS_APPROVED: u8 = 2;
    const REVIEW_STATUS_REJECTED: u8 = 3;

    /// Maximum and minimum scores
    const MAX_SCORE: u64 = 1000;
    const MIN_SCORE: u64 = 0;
    const INITIAL_SCORE: u64 = 500;

    /// User reputation profile
    struct ReputationProfile has key {
        user_address: address,
        user_type: u8,
        total_score: u64,
        performance_score: u64,
        data_quality_score: u64,
        delivery_score: u64,
        community_score: u64,
        compliance_score: u64,
        total_transactions: u64,
        successful_transactions: u64,
        failed_transactions: u64,
        last_updated: u64,
        registration_date: u64,
        reviews_received: Table<address, Review>,
        reviews_given: vector<address>,
        achievements: vector<Achievement>,
        reputation_history: vector<ScoreChange>
    }

    /// Review structure
    struct Review has store, copy, drop {
        reviewer: address,
        rating: u8,  // 1-5 stars
        comment: String,
        category: u8,
        timestamp: u64,
        transaction_id: Option<u64>,
        verified: bool,
        status: u8,
        helpful_votes: u64,
        total_votes: u64
    }

    /// Achievement structure
    struct Achievement has store, copy, drop {
        achievement_id: String,
        title: String,
        description: String,
        earned_date: u64,
        points_awarded: u64
    }

    /// Score change history
    struct ScoreChange has store, copy, drop {
        category: u8,
        old_score: u64,
        new_score: u64,
        change_reason: String,
        timestamp: u64,
        actor: address
    }

    /// Reputation system registry
    struct ReputationRegistry has key {
        total_users: u64,
        authorized_updaters: vector<address>,
        admin: address,
        reputation_thresholds: Table<String, u64>,
        achievement_definitions: Table<String, AchievementDefinition>,
        review_cooldown_period: u64, // Time between reviews in seconds
        reputation_updated_events: EventHandle<ReputationUpdated>,
        review_added_events: EventHandle<ReviewAdded>,
        achievement_earned_events: EventHandle<AchievementEarned>
    }

    /// Achievement definition
    struct AchievementDefinition has store, copy, drop {
        achievement_id: String,
        title: String,
        description: String,
        criteria: String,
        points_reward: u64,
        badge_icon: String
    }

    /// Reputation badge levels
    struct ReputationBadge has copy, drop {
        level: String,
        min_score: u64,
        benefits: vector<String>
    }

    /// Events
    struct ReputationUpdated has drop, store {
        user: address,
        category: u8,
        old_score: u64,
        new_score: u64,
        new_total_score: u64,
        timestamp: u64,
        reason: String
    }

    struct ReviewAdded has drop, store {
        reviewee: address,
        reviewer: address,
        rating: u8,
        category: u8,
        transaction_id: Option<u64>,
        timestamp: u64
    }

    struct AchievementEarned has drop, store {
        user: address,
        achievement_id: String,
        points_awarded: u64,
        timestamp: u64
    }

    /// Initialize reputation system
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        let registry = ReputationRegistry {
            total_users: 0,
            authorized_updaters: vector::singleton(admin_addr),
            admin: admin_addr,
            reputation_thresholds: table::new(),
            achievement_definitions: table::new(),
            review_cooldown_period: 86400, // 24 hours in seconds
            reputation_updated_events: account::new_event_handle<ReputationUpdated>(admin),
            review_added_events: account::new_event_handle<ReviewAdded>(admin),
            achievement_earned_events: account::new_event_handle<AchievementEarned>(admin)
        };

        move_to(admin, registry);

        // Initialize reputation thresholds and achievements
        initialize_reputation_system(&mut registry);
    }

    /// Create reputation profile for new user
    public entry fun create_profile(
        user: &signer,
        user_type: u8
    ) acquires ReputationRegistry {
        let user_addr = signer::address_of(user);

        // Check if profile already exists
        if (exists<ReputationProfile>(user_addr)) {
            return
        };

        let current_time = timestamp::now_seconds();
        let profile = ReputationProfile {
            user_address: user_addr,
            user_type,
            total_score: INITIAL_SCORE,
            performance_score: 100,
            data_quality_score: 100,
            delivery_score: 100,
            community_score: 100,
            compliance_score: 100,
            total_transactions: 0,
            successful_transactions: 0,
            failed_transactions: 0,
            last_updated: current_time,
            registration_date: current_time,
            reviews_received: table::new(),
            reviews_given: vector::empty(),
            achievements: vector::empty(),
            reputation_history: vector::empty()
        };

        move_to(user, profile);

        // Update registry
        let registry = borrow_global_mut<ReputationRegistry>(@carbon_marketplace);
        registry.total_users = registry.total_users + 1;

        // Award registration achievement
        award_achievement(user_addr, string::utf8(b"NEW_USER"));
    }

    /// Update reputation score
    public entry fun update_score(
        updater: &signer,
        user_addr: address,
        category: u8,
        score_change: u64,
        increase: bool,
        reason: String
    ) acquires ReputationProfile, ReputationRegistry {
        let updater_addr = signer::address_of(updater);
        let registry = borrow_global<ReputationRegistry>(@carbon_marketplace);

        // Verify updater authorization
        assert!(
            vector::contains(&registry.authorized_updaters, &updater_addr) ||
            updater_addr == registry.admin,
            E_NOT_AUTHORIZED
        );
        assert!(exists<ReputationProfile>(user_addr), E_PROFILE_NOT_FOUND);

        let profile = borrow_global_mut<ReputationProfile>(user_addr);
        let old_score = get_category_score(profile, category);
        let old_total = profile.total_score;

        // Update specific category score
        update_category_score(profile, category, score_change, increase);

        // Recalculate total score
        profile.total_score = calculate_total_score(profile);
        profile.last_updated = timestamp::now_seconds();

        // Record score change history
        let score_change_record = ScoreChange {
            category,
            old_score,
            new_score: get_category_score(profile, category),
            change_reason: reason,
            timestamp: timestamp::now_seconds(),
            actor: updater_addr
        };
        vector::push_back(&mut profile.reputation_history, score_change_record);

        // Check for achievements
        check_and_award_achievements(user_addr, profile);

        // Emit event
        let registry_mut = borrow_global_mut<ReputationRegistry>(@carbon_marketplace);
        event::emit_event(&mut registry_mut.reputation_updated_events, ReputationUpdated {
            user: user_addr,
            category,
            old_score,
            new_score: get_category_score(profile, category),
            new_total_score: profile.total_score,
            timestamp: timestamp::now_seconds(),
            reason
        });
    }

    /// Add review for user
    public entry fun add_review(
        reviewer: &signer,
        reviewee: address,
        rating: u8,
        comment: String,
        category: u8,
        transaction_id: Option<u64>
    ) acquires ReputationProfile, ReputationRegistry {
        let reviewer_addr = signer::address_of(reviewer);

        assert!(rating >= 1 && rating <= 5, E_INVALID_RATING);
        assert!(reviewer_addr != reviewee, E_CANNOT_REVIEW_SELF);
        assert!(exists<ReputationProfile>(reviewee), E_PROFILE_NOT_FOUND);

        let profile = borrow_global_mut<ReputationProfile>(reviewee);

        // Check for duplicate review (same reviewer for same transaction)
        if (option::is_some(&transaction_id)) {
            let tx_id = option::extract(&mut transaction_id);
            // Check if reviewer has already reviewed this transaction
            // (Implementation would check existing reviews)
        };

        // Check cooldown period
        let registry = borrow_global<ReputationRegistry>(@carbon_marketplace);
        // (Implementation would check last review time)

        let current_time = timestamp::now_seconds();
        let review = Review {
            reviewer: reviewer_addr,
            rating,
            comment,
            category,
            timestamp: current_time,
            transaction_id,
            verified: true, // Would implement verification logic
            status: REVIEW_STATUS_APPROVED,
            helpful_votes: 0,
            total_votes: 0
        };

        // Add review to profile
        table::add(&mut profile.reviews_received, reviewer_addr, review);

        // Update reviewer's given reviews
        if (!exists<ReputationProfile>(reviewer_addr)) {
            create_profile_internal(reviewer_addr, USER_TYPE_COMPANY);
        };
        let reviewer_profile = borrow_global_mut<ReputationProfile>(reviewer_addr);
        vector::push_back(&mut reviewer_profile.reviews_given, reviewee);

        // Update score based on review
        let score_change = calculate_score_from_rating(rating);
        let increase = rating > 3;
        update_category_score(profile, category, score_change, increase);
        profile.total_score = calculate_total_score(profile);

        // Check for achievements
        check_and_award_achievements(reviewee, profile);

        // Emit event
        let registry_mut = borrow_global_mut<ReputationRegistry>(@carbon_marketplace);
        event::emit_event(&mut registry_mut.review_added_events, ReviewAdded {
            reviewee,
            reviewer: reviewer_addr,
            rating,
            category,
            transaction_id,
            timestamp: current_time
        });
    }

    /// Record successful transaction
    public entry fun record_transaction_success(
        updater: &signer,
        user_addr: address,
        transaction_value: u64
    ) acquires ReputationProfile, ReputationRegistry {
        let updater_addr = signer::address_of(updater);
        let registry = borrow_global<ReputationRegistry>(@carbon_marketplace);

        assert!(
            vector::contains(&registry.authorized_updaters, &updater_addr) ||
            updater_addr == registry.admin,
            E_NOT_AUTHORIZED
        );

        let profile = borrow_global_mut<ReputationProfile>(user_addr);
        profile.total_transactions = profile.total_transactions + 1;
        profile.successful_transactions = profile.successful_transactions + 1;

        // Award points based on transaction value and success rate
        let success_rate = (profile.successful_transactions * 100) / profile.total_transactions;
        let bonus_points = if (success_rate >= 95) { 10 } else if (success_rate >= 90) { 5 } else { 2 };

        update_category_score(profile, REP_DELIVERY, bonus_points, true);
        profile.total_score = calculate_total_score(profile);

        // Check for achievements
        check_and_award_achievements(user_addr, profile);
    }

    /// Record failed transaction
    public entry fun record_transaction_failure(
        updater: &signer,
        user_addr: address,
        failure_reason: String
    ) acquires ReputationProfile, ReputationRegistry {
        let updater_addr = signer::address_of(updater);
        let registry = borrow_global<ReputationRegistry>(@carbon_marketplace);

        assert!(
            vector::contains(&registry.authorized_updaters, &updater_addr) ||
            updater_addr == registry.admin,
            E_NOT_AUTHORIZED
        );

        let profile = borrow_global_mut<ReputationProfile>(user_addr);
        profile.total_transactions = profile.total_transactions + 1;
        profile.failed_transactions = profile.failed_transactions + 1;

        // Reduce delivery score for failed transactions
        let penalty_points = 5;
        update_category_score(profile, REP_DELIVERY, penalty_points, false);
        profile.total_score = calculate_total_score(profile);
    }

    /// Award achievement
    fun award_achievement(user_addr: address, achievement_id: String) acquires ReputationProfile, ReputationRegistry {
        let profile = borrow_global_mut<ReputationProfile>(user_addr);
        let registry = borrow_global_mut<ReputationRegistry>(@carbon_marketplace);

        // Check if achievement already earned
        let i = 0;
        let len = vector::length(&profile.achievements);
        while (i < len) {
            let achievement = vector::borrow(&profile.achievements, i);
            if (achievement.achievement_id == achievement_id) {
                return // Already earned
            };
            i = i + 1;
        };

        // Get achievement definition
        if (table::contains(&registry.achievement_definitions, achievement_id)) {
            let definition = table::borrow(&registry.achievement_definitions, achievement_id);
            let current_time = timestamp::now_seconds();

            let achievement = Achievement {
                achievement_id,
                title: definition.title,
                description: definition.description,
                earned_date: current_time,
                points_awarded: definition.points_reward
            };

            vector::push_back(&mut profile.achievements, achievement);

            // Award points
            profile.community_score = math64::min(profile.community_score + definition.points_reward, MAX_SCORE);
            profile.total_score = calculate_total_score(profile);

            // Emit event
            event::emit_event(&mut registry.achievement_earned_events, AchievementEarned {
                user: user_addr,
                achievement_id,
                points_awarded: definition.points_reward,
                timestamp: current_time
            });
        };
    }

    /// Check and award achievements based on profile state
    fun check_and_award_achievements(user_addr: address, profile: &ReputationProfile) acquires ReputationRegistry {
        // High performer achievement (total score > 800)
        if (profile.total_score > 800) {
            award_achievement(user_addr, string::utf8(b"HIGH_PERFORMER"));
        };

        // Veteran achievement (100+ transactions)
        if (profile.total_transactions >= 100) {
            award_achievement(user_addr, string::utf8(b"VETERAN_TRADER"));
        };

        // Reliable achievement (95%+ success rate with 10+ transactions)
        if (profile.total_transactions >= 10) {
            let success_rate = (profile.successful_transactions * 100) / profile.total_transactions;
            if (success_rate >= 95) {
                award_achievement(user_addr, string::utf8(b"RELIABLE_PARTNER"));
            };
        };

        // Data quality expert (data quality score > 900)
        if (profile.data_quality_score > 900) {
            award_achievement(user_addr, string::utf8(b"DATA_QUALITY_EXPERT"));
        };
    }

    /// Get reputation badge level
    public fun get_reputation_badge(total_score: u64): ReputationBadge {
        if (total_score >= 900) {
            ReputationBadge {
                level: string::utf8(b"Platinum"),
                min_score: 900,
                benefits: vector::singleton(string::utf8(b"Premium support, reduced fees, priority listings"))
            }
        } else if (total_score >= 750) {
            ReputationBadge {
                level: string::utf8(b"Gold"),
                min_score: 750,
                benefits: vector::singleton(string::utf8(b"Priority support, reduced fees"))
            }
        } else if (total_score >= 600) {
            ReputationBadge {
                level: string::utf8(b"Silver"),
                min_score: 600,
                benefits: vector::singleton(string::utf8(b"Standard support, moderate fees"))
            }
        } else {
            ReputationBadge {
                level: string::utf8(b"Bronze"),
                min_score: 0,
                benefits: vector::singleton(string::utf8(b"Basic support"))
            }
        }
    }

    /// Get user reputation info
    #[view]
    public fun get_reputation_info(
        user_addr: address
    ): (u64, u64, u64, u64, u64, u64, u64, u64, u64) acquires ReputationProfile {
        if (!exists<ReputationProfile>(user_addr)) {
            return (0, 0, 0, 0, 0, 0, 0, 0, 0)
        };

        let profile = borrow_global<ReputationProfile>(user_addr);
        (
            profile.total_score,
            profile.performance_score,
            profile.data_quality_score,
            profile.delivery_score,
            profile.community_score,
            profile.compliance_score,
            profile.total_transactions,
            profile.successful_transactions,
            vector::length(&profile.achievements)
        )
    }

    /// Get user achievements
    #[view]
    public fun get_user_achievements(user_addr: address): vector<Achievement> acquires ReputationProfile {
        if (!exists<ReputationProfile>(user_addr)) {
            return vector::empty()
        };
        let profile = borrow_global<ReputationProfile>(user_addr);
        profile.achievements
    }

    /// Helper functions
    fun get_category_score(profile: &ReputationProfile, category: u8): u64 {
        if (category == REP_PERFORMANCE) {
            profile.performance_score
        } else if (category == REP_DATA_QUALITY) {
            profile.data_quality_score
        } else if (category == REP_DELIVERY) {
            profile.delivery_score
        } else if (category == REP_COMMUNITY) {
            profile.community_score
        } else if (category == REP_COMPLIANCE) {
            profile.compliance_score
        } else {
            0
        }
    }

    fun update_category_score(
        profile: &mut ReputationProfile,
        category: u8,
        score_change: u64,
        increase: bool
    ) {
        if (category == REP_PERFORMANCE) {
            if (increase) {
                profile.performance_score = math64::min(profile.performance_score + score_change, MAX_SCORE);
            } else {
                profile.performance_score = if (profile.performance_score > score_change) {
                    profile.performance_score - score_change
                } else {
                    MIN_SCORE
                };
            };
        } else if (category == REP_DATA_QUALITY) {
            if (increase) {
                profile.data_quality_score = math64::min(profile.data_quality_score + score_change, MAX_SCORE);
            } else {
                profile.data_quality_score = if (profile.data_quality_score > score_change) {
                    profile.data_quality_score - score_change
                } else {
                    MIN_SCORE
                };
            };
        } else if (category == REP_DELIVERY) {
            if (increase) {
                profile.delivery_score = math64::min(profile.delivery_score + score_change, MAX_SCORE);
            } else {
                profile.delivery_score = if (profile.delivery_score > score_change) {
                    profile.delivery_score - score_change
                } else {
                    MIN_SCORE
                };
            };
        } else if (category == REP_COMMUNITY) {
            if (increase) {
                profile.community_score = math64::min(profile.community_score + score_change, MAX_SCORE);
            } else {
                profile.community_score = if (profile.community_score > score_change) {
                    profile.community_score - score_change
                } else {
                    MIN_SCORE
                };
            };
        } else if (category == REP_COMPLIANCE) {
            if (increase) {
                profile.compliance_score = math64::min(profile.compliance_score + score_change, MAX_SCORE);
            } else {
                profile.compliance_score = if (profile.compliance_score > score_change) {
                    profile.compliance_score - score_change
                } else {
                    MIN_SCORE
                };
            };
        };
    }

    fun calculate_total_score(profile: &ReputationProfile): u64 {
        let weighted_sum =
            (profile.performance_score * 25) +      // 25% weight
            (profile.data_quality_score * 20) +     // 20% weight
            (profile.delivery_score * 25) +         // 25% weight
            (profile.community_score * 15) +        // 15% weight
            (profile.compliance_score * 15);        // 15% weight

        weighted_sum / 100
    }

    fun calculate_score_from_rating(rating: u8): u64 {
        if (rating == 5) { 15 }
        else if (rating == 4) { 10 }
        else if (rating == 3) { 0 }
        else if (rating == 2) { 8 }
        else { 15 }
    }

    fun create_profile_internal(user_addr: address, user_type: u8) acquires ReputationRegistry {
        let current_time = timestamp::now_seconds();
        let profile = ReputationProfile {
            user_address: user_addr,
            user_type,
            total_score: INITIAL_SCORE,
            performance_score: 100,
            data_quality_score: 100,
            delivery_score: 100,
            community_score: 100,
            compliance_score: 100,
            total_transactions: 0,
            successful_transactions: 0,
            failed_transactions: 0,
            last_updated: current_time,
            registration_date: current_time,
            reviews_received: table::new(),
            reviews_given: vector::empty(),
            achievements: vector::empty(),
            reputation_history: vector::empty()
        };

        move_to(admin, profile);

        let registry = borrow_global_mut<ReputationRegistry>(@carbon_marketplace);
        registry.total_users = registry.total_users + 1;
    }

    fun initialize_reputation_system(registry: &mut ReputationRegistry) {
        // Initialize achievement definitions
        let new_user_achievement = AchievementDefinition {
            achievement_id: string::utf8(b"NEW_USER"),
            title: string::utf8(b"Welcome to Carbon Marketplace"),
            description: string::utf8(b"Successfully registered on the platform"),
            criteria: string::utf8(b"Complete registration"),
            points_reward: 10,
            badge_icon: string::utf8(b"welcome_badge.svg")
        };
        table::add(&mut registry.achievement_definitions, string::utf8(b"NEW_USER"), new_user_achievement);

        let veteran_achievement = AchievementDefinition {
            achievement_id: string::utf8(b"VETERAN_TRADER"),
            title: string::utf8(b"Veteran Trader"),
            description: string::utf8(b"Completed 100+ transactions"),
            criteria: string::utf8(b"Complete 100 transactions"),
            points_reward: 50,
            badge_icon: string::utf8(b"veteran_badge.svg")
        };
        table::add(&mut registry.achievement_definitions, string::utf8(b"VETERAN_TRADER"), veteran_achievement);

        // Initialize reputation thresholds
        table::add(&mut registry.reputation_thresholds, string::utf8(b"BRONZE"), 0);
        table::add(&mut registry.reputation_thresholds, string::utf8(b"SILVER"), 600);
        table::add(&mut registry.reputation_thresholds, string::utf8(b"GOLD"), 750);
        table::add(&mut registry.reputation_thresholds, string::utf8(b"PLATINUM"), 900);
    }

    /// Get registry statistics
    #[view]
    public fun get_registry_stats(): (u64, u64) acquires ReputationRegistry {
        let registry = borrow_global<ReputationRegistry>(@carbon_marketplace);
        (registry.total_users, vector::length(&registry.authorized_updaters))
    }
}