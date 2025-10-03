use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet, Vector};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};
use std::collections::HashSet;

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    Assets,
    AssetList,
    PriceReports,
    AggregatedPrices,
    AuthorizedNodes,
    NodeDetails,
    WhitelistedOperators,
    ApprovedCodeHashes,
    ApprovedEnclaves,
    OperatorToNode,
    NodeToOperator,
    AdminProposers,
    AdminVoters,
    AdminProposals,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Price {
    pub multiplier: u128,
    pub decimals: u8,
    pub timestamp: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct PriceReport {
    pub oracle_id: AccountId,
    pub price: Price,
    pub timestamp: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Asset {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub active: bool,
    pub min_sources: u8,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OracleNode {
    pub account_id: AccountId,
    pub operator_id: AccountId,
    pub registered_at: u64,
    pub code_hash: String,
    pub last_report: u64,
    pub active: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PriceData {
    pub asset_id: String,
    pub price: Price,
    pub num_sources: u8,
}

// Pyth-compatible price structure
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PythPrice {
    pub price: i64,
    pub conf: u64,
    pub expo: i32,
    pub publish_time: i64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde", tag = "type", content = "detail")]
pub enum AdminAction {
    AddNodeOperator {
        account_id: AccountId,
    },
    RemoveNodeOperator {
        account_id: AccountId,
    },
    ApproveCodeHash {
        code_hash: String,
    },
    RemoveCodeHash {
        code_hash: String,
    },
    ApproveAttestation {
        code_hash: String,
        mr_enclave: String,
    },
    RemoveAttestation {
        code_hash: String,
    },
    Pause,
    Resume,
    UpdateConfig {
        recency_threshold: Option<u64>,
        min_report_count: Option<u8>,
    },
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AdminProposal {
    pub id: u64,
    pub proposer: AccountId,
    pub action: AdminAction,
    pub scheduled_for: u64,
    pub approvals: Vec<AccountId>,
    pub executed: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AdminRoleView {
    pub proposers: Vec<AccountId>,
    pub voters: Vec<AccountId>,
    pub timelock_delay: u64,
    pub quorum_bps: u16,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AttestationData {
    pub mr_enclave: String,
    pub issued_at: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Oracle {
    pub owner: AccountId,
    pub paused: bool,
    pub assets: UnorderedMap<String, Asset>,
    pub asset_list: Vector<String>,
    pub price_reports: LookupMap<String, Vec<PriceReport>>,
    pub aggregated_prices: LookupMap<String, Price>,
    pub authorized_nodes: UnorderedSet<AccountId>,
    pub node_details: LookupMap<AccountId, OracleNode>,
    pub whitelisted_operators: UnorderedSet<AccountId>,
    pub approved_code_hashes: UnorderedSet<String>,
    pub approved_enclaves: LookupMap<String, String>,
    pub operator_to_node: LookupMap<AccountId, AccountId>,
    pub node_to_operator: LookupMap<AccountId, AccountId>,
    pub recency_threshold: u64,
    pub min_report_count: u8,
    pub attestation_max_age: u64,
    pub admin_proposers: UnorderedSet<AccountId>,
    pub admin_voters: UnorderedSet<AccountId>,
    pub admin_timelock_delay: u64,
    pub admin_quorum_bps: u16,
    pub proposals: UnorderedMap<u64, AdminProposal>,
    pub proposal_counter: u64,
}

#[near_bindgen]
impl Oracle {
    #[init]
    pub fn new(owner: AccountId, recency_threshold: u64, min_report_count: u8) -> Self {
        Self {
            owner,
            paused: false,
            assets: UnorderedMap::new(StorageKey::Assets),
            asset_list: Vector::new(StorageKey::AssetList),
            price_reports: LookupMap::new(StorageKey::PriceReports),
            aggregated_prices: LookupMap::new(StorageKey::AggregatedPrices),
            authorized_nodes: UnorderedSet::new(StorageKey::AuthorizedNodes),
            node_details: LookupMap::new(StorageKey::NodeDetails),
            whitelisted_operators: UnorderedSet::new(StorageKey::WhitelistedOperators),
            approved_code_hashes: UnorderedSet::new(StorageKey::ApprovedCodeHashes),
            approved_enclaves: LookupMap::new(StorageKey::ApprovedEnclaves),
            operator_to_node: LookupMap::new(StorageKey::OperatorToNode),
            node_to_operator: LookupMap::new(StorageKey::NodeToOperator),
            recency_threshold,
            min_report_count: min_report_count.max(1),
            attestation_max_age: 600_000_000_000,
            admin_proposers: UnorderedSet::new(StorageKey::AdminProposers),
            admin_voters: UnorderedSet::new(StorageKey::AdminVoters),
            admin_timelock_delay: 0,
            admin_quorum_bps: 5000,
            proposals: UnorderedMap::new(StorageKey::AdminProposals),
            proposal_counter: 0,
        }
    }

    // Admin functions
    pub fn add_asset(&mut self, asset: Asset) {
        self.assert_owner();
        let asset_id = asset.id.clone();
        self.assets.insert(&asset_id, &asset);
        self.asset_list.push(&asset_id);
        env::log_str(&format!("Asset added: {}", asset_id));
    }

    pub fn add_node_operator(&mut self, operator_account: AccountId) {
        self.assert_owner();
        self.internal_add_node_operator(operator_account);
    }

    pub fn remove_node_operator(&mut self, operator_account: AccountId) {
        self.assert_owner();
        self.internal_remove_node_operator(&operator_account);
    }

    pub fn approve_code_hash(&mut self, code_hash: String) {
        self.assert_owner();
        self.internal_approve_code_hash(code_hash);
    }

    pub fn remove_code_hash(&mut self, code_hash: String) {
        self.assert_owner();
        self.internal_remove_code_hash(&code_hash);
    }

    pub fn approve_attestation(&mut self, code_hash: String, mr_enclave: String) {
        self.assert_owner();
        assert!(
            self.approved_code_hashes.contains(&code_hash),
            "Code hash must be approved first"
        );
        self.approved_enclaves.insert(&code_hash, &mr_enclave);
        env::log_str(&format!("Attestation approved for {}", code_hash));
    }

    pub fn remove_attestation(&mut self, code_hash: String) {
        self.assert_owner();
        self.approved_enclaves.remove(&code_hash);
        env::log_str(&format!("Attestation removed for {}", code_hash));
    }

    pub fn pause(&mut self) {
        self.assert_owner();
        self.internal_pause();
    }

    pub fn resume(&mut self) {
        self.assert_owner();
        self.internal_resume();
    }

    pub fn update_config(&mut self, recency_threshold: Option<u64>, min_report_count: Option<u8>) {
        self.assert_owner();
        self.internal_update_config(recency_threshold, min_report_count);
    }

    pub fn set_attestation_max_age(&mut self, max_age: u64) {
        self.assert_owner();
        assert!(max_age > 0, "Max age must be positive");
        self.attestation_max_age = max_age;
        env::log_str(&format!("Attestation max age set to {} ns", max_age));
    }

    // Node operator functions
    pub fn set_node_account(&mut self, node_account: AccountId) {
        let operator_id = env::predecessor_account_id();
        assert!(
            self.whitelisted_operators.contains(&operator_id),
            "Not a whitelisted operator"
        );
        if let Some(previous_node) = self.operator_to_node.get(&operator_id) {
            self.node_to_operator.remove(&previous_node);
            self.authorized_nodes.remove(&previous_node);
            self.node_details.remove(&previous_node);
        }
        self.operator_to_node.insert(&operator_id, &node_account);
        self.node_to_operator.insert(&node_account, &operator_id);
        env::log_str(&format!(
            "Node account set: {} -> {}",
            operator_id, node_account
        ));
    }

    // Node registration with attestation verification
    pub fn register_node(&mut self, code_hash: String, attestation: AttestationData) {
        let node_account = env::predecessor_account_id();

        // Check if this node account is authorized by an operator
        let operator = self
            .node_to_operator
            .get(&node_account)
            .expect("Node account not set by any operator");

        assert!(
            self.whitelisted_operators.contains(&operator),
            "Operator not whitelisted"
        );

        // Verify code hash is approved
        assert!(
            self.approved_code_hashes.contains(&code_hash),
            "Code hash not approved"
        );

        let expected_mr_enclave = self
            .approved_enclaves
            .get(&code_hash)
            .expect("Attestation not approved for code hash");
        assert_eq!(
            expected_mr_enclave, attestation.mr_enclave,
            "Attestation measurement mismatch"
        );
        let now = env::block_timestamp();
        assert!(
            now.saturating_sub(attestation.issued_at) <= self.attestation_max_age,
            "Attestation expired"
        );

        // Register node
        let node = OracleNode {
            account_id: node_account.clone(),
            operator_id: operator,
            registered_at: env::block_timestamp(),
            code_hash,
            last_report: 0,
            active: true,
        };

        self.authorized_nodes.insert(&node_account);
        self.node_details.insert(&node_account, &node);

        env::log_str(&format!("Node registered: {}", node_account));
    }

    // Price reporting
    pub fn report_price(&mut self, asset_id: String, multiplier: u128, decimals: u8) {
        assert!(!self.paused, "Oracle is paused");

        let node_account = env::predecessor_account_id();
        assert!(
            self.authorized_nodes.contains(&node_account),
            "Not an authorized node"
        );

        // Verify asset exists and decimals align
        let asset = self.assets.get(&asset_id).expect("Asset not found");
        assert_eq!(
            asset.decimals, decimals,
            "Decimals mismatch with asset definition"
        );

        let timestamp = env::block_timestamp();

        // Update reports for this asset
        let mut reports = self.price_reports.get(&asset_id).unwrap_or_default();

        // Replace existing report from this oracle
        reports.retain(|r| r.oracle_id != node_account);

        reports.push(PriceReport {
            oracle_id: node_account.clone(),
            price: Price {
                multiplier,
                decimals,
                timestamp,
            },
            timestamp,
        });

        self.finalize_reports(asset_id.clone(), &asset, reports);

        // Update node's last report time
        if let Some(mut node) = self.node_details.get(&node_account) {
            node.last_report = timestamp;
            self.node_details.insert(&node_account, &node);
        }

        env::log_str(&format!(
            "Price reported for {} by {}",
            asset_id, node_account
        ));
    }

    // Query functions
    pub fn get_price(&self, asset_id: String) -> Option<PriceData> {
        let price = self.aggregated_prices.get(&asset_id)?;

        if self.recency_threshold > 0 {
            let now = env::block_timestamp();
            if now.saturating_sub(price.timestamp) > self.recency_threshold {
                return None;
            }
        }

        let reports = self.price_reports.get(&asset_id).unwrap_or_default();

        Some(PriceData {
            asset_id,
            price,
            num_sources: reports.len() as u8,
        })
    }

    pub fn get_price_no_older_than(&self, asset_id: String, max_age: u64) -> Option<PythPrice> {
        let price = self.aggregated_prices.get(&asset_id)?;

        if env::block_timestamp().saturating_sub(price.timestamp) > max_age {
            return None;
        }

        Some(PythPrice {
            price: price.multiplier as i64,
            conf: 0,
            expo: -(price.decimals as i32),
            publish_time: (price.timestamp / 1_000_000_000) as i64,
        })
    }

    pub fn get_price_unsafe(&self, asset_id: String) -> Option<PythPrice> {
        let price = self.aggregated_prices.get(&asset_id)?;

        Some(PythPrice {
            price: price.multiplier as i64,
            conf: 0,
            expo: -(price.decimals as i32),
            publish_time: (price.timestamp / 1_000_000_000) as i64,
        })
    }

    pub fn get_price_data(&self) -> Vec<PriceData> {
        let mut result = Vec::new();
        for i in 0..self.asset_list.len() {
            if let Some(asset_id) = self.asset_list.get(i) {
                if let Some(price_data) = self.get_price(asset_id) {
                    result.push(price_data);
                }
            }
        }
        result
    }

    pub fn get_assets(&self) -> Vec<Asset> {
        let mut result = Vec::new();
        for i in 0..self.asset_list.len() {
            if let Some(asset_id) = self.asset_list.get(i) {
                if let Some(asset) = self.assets.get(&asset_id) {
                    result.push(asset);
                }
            }
        }
        result
    }

    pub fn is_authorized(&self, account_id: AccountId) -> bool {
        self.authorized_nodes.contains(&account_id)
    }

    pub fn get_node_details(&self, account_id: AccountId) -> Option<OracleNode> {
        self.node_details.get(&account_id)
    }

    pub fn get_authorized_nodes(&self) -> Vec<AccountId> {
        self.authorized_nodes.iter().collect()
    }

    pub fn get_admin_role(&self) -> AdminRoleView {
        AdminRoleView {
            proposers: self.admin_proposers.iter().collect(),
            voters: self.admin_voters.iter().collect(),
            timelock_delay: self.admin_timelock_delay,
            quorum_bps: self.admin_quorum_bps,
        }
    }

    pub fn list_proposals(&self) -> Vec<AdminProposal> {
        self.proposals
            .iter()
            .map(|(_, proposal)| proposal)
            .collect()
    }

    pub fn configure_admin_role(
        &mut self,
        proposers: Vec<AccountId>,
        voters: Vec<AccountId>,
        timelock_delay: u64,
        quorum_bps: u16,
    ) {
        self.assert_owner();
        assert!(!voters.is_empty(), "Voter set cannot be empty");
        assert!(quorum_bps <= 10_000, "Quorum must be <= 10000 basis points");

        let proposer_set: HashSet<AccountId> = proposers.into_iter().collect();
        let voter_set: HashSet<AccountId> = voters.into_iter().collect();

        for account in self.admin_proposers.iter().collect::<Vec<_>>() {
            self.admin_proposers.remove(&account);
        }
        for account in self.admin_voters.iter().collect::<Vec<_>>() {
            self.admin_voters.remove(&account);
        }
        for (id, _) in self.proposals.iter().collect::<Vec<_>>() {
            self.proposals.remove(&id);
        }

        for account in proposer_set {
            self.admin_proposers.insert(&account);
        }
        for account in voter_set {
            self.admin_voters.insert(&account);
        }

        self.admin_timelock_delay = timelock_delay;
        self.admin_quorum_bps = if quorum_bps == 0 { 1 } else { quorum_bps };

        env::log_str("Admin role configured");
    }

    pub fn propose_action(&mut self, action: AdminAction) {
        let caller = env::predecessor_account_id();
        assert!(
            self.admin_proposers.contains(&caller),
            "Caller is not an admin proposer"
        );

        let scheduled_for = env::block_timestamp().saturating_add(self.admin_timelock_delay);
        let mut approvals = Vec::new();
        if self.admin_voters.contains(&caller) {
            approvals.push(caller.clone());
        }

        let proposal_id = self.proposal_counter.saturating_add(1);
        self.proposal_counter = proposal_id;

        let proposal = AdminProposal {
            id: proposal_id,
            proposer: caller.clone(),
            action,
            scheduled_for,
            approvals,
            executed: false,
        };

        self.proposals.insert(&proposal_id, &proposal);
        env::log_str(&format!(
            "Admin action proposed by {}: {}",
            caller, proposal_id
        ));
    }

    pub fn approve_proposal(&mut self, proposal_id: u64) {
        let caller = env::predecessor_account_id();
        assert!(
            self.admin_voters.contains(&caller),
            "Caller is not an admin voter"
        );

        let mut proposal = self
            .proposals
            .get(&proposal_id)
            .expect("Proposal not found");
        assert!(!proposal.executed, "Proposal already executed");

        if proposal.approvals.contains(&caller) {
            env::log_str("Voter already approved proposal");
            return;
        }

        proposal.approvals.push(caller.clone());
        self.proposals.insert(&proposal_id, &proposal);
        env::log_str(&format!("Proposal {} approved by {}", proposal_id, caller));
    }

    pub fn execute_proposal(&mut self, proposal_id: u64) {
        let caller = env::predecessor_account_id();
        assert!(
            self.admin_proposers.contains(&caller),
            "Caller is not authorized to execute proposals"
        );

        let proposal = self
            .proposals
            .get(&proposal_id)
            .expect("Proposal not found");
        assert!(!proposal.executed, "Proposal already executed");
        assert!(
            env::block_timestamp() >= proposal.scheduled_for,
            "Timelock delay has not elapsed"
        );
        assert!(
            self.has_quorum(proposal.approvals.len()),
            "Proposal does not meet quorum"
        );

        self.execute_admin_action(&proposal.action);
        self.proposals.remove(&proposal_id);
        env::log_str(&format!("Proposal {} executed by {}", proposal_id, caller));
    }

    pub fn cancel_proposal(&mut self, proposal_id: u64) {
        self.assert_owner();
        self.proposals
            .remove(&proposal_id)
            .expect("Proposal not found");
        env::log_str(&format!("Proposal {} cancelled", proposal_id));
    }

    // Internal helper functions
    fn execute_admin_action(&mut self, action: &AdminAction) {
        match action {
            AdminAction::AddNodeOperator { account_id } => {
                self.internal_add_node_operator(account_id.clone());
            }
            AdminAction::RemoveNodeOperator { account_id } => {
                self.internal_remove_node_operator(account_id);
            }
            AdminAction::ApproveCodeHash { code_hash } => {
                self.internal_approve_code_hash(code_hash.clone());
            }
            AdminAction::RemoveCodeHash { code_hash } => {
                self.internal_remove_code_hash(code_hash);
            }
            AdminAction::ApproveAttestation {
                code_hash,
                mr_enclave,
            } => {
                self.approved_enclaves.insert(&code_hash, &mr_enclave);
                env::log_str(&format!(
                    "Attestation approved via governance for {}",
                    code_hash
                ));
            }
            AdminAction::RemoveAttestation { code_hash } => {
                self.approved_enclaves.remove(&code_hash);
                env::log_str(&format!(
                    "Attestation removed via governance for {}",
                    code_hash
                ));
            }
            AdminAction::Pause => self.internal_pause(),
            AdminAction::Resume => self.internal_resume(),
            AdminAction::UpdateConfig {
                recency_threshold,
                min_report_count,
            } => {
                self.internal_update_config(recency_threshold.clone(), min_report_count.clone());
            }
        }
    }

    fn has_quorum(&self, approvals_len: usize) -> bool {
        approvals_len >= self.required_approvals()
    }

    fn required_approvals(&self) -> usize {
        let voter_count = self.admin_voters.len() as u128;
        if voter_count == 0 {
            return 0;
        }
        let quorum_bps = self.admin_quorum_bps as u128;
        let mut required = (voter_count * quorum_bps + 9_999) / 10_000;
        if required == 0 {
            required = 1;
        }
        required as usize
    }

    fn internal_add_node_operator(&mut self, operator_account: AccountId) {
        self.whitelisted_operators.insert(&operator_account);
        env::log_str(&format!("Node operator added: {}", operator_account));
    }

    fn internal_remove_node_operator(&mut self, operator_account: &AccountId) {
        self.whitelisted_operators.remove(operator_account);
        if let Some(node_account) = self.operator_to_node.get(operator_account) {
            self.operator_to_node.remove(operator_account);
            self.node_to_operator.remove(&node_account);
            self.authorized_nodes.remove(&node_account);
            self.node_details.remove(&node_account);

            for i in 0..self.asset_list.len() {
                if let Some(asset_id) = self.asset_list.get(i) {
                    if let Some(mut reports) = self.price_reports.get(&asset_id) {
                        reports.retain(|r| r.oracle_id != node_account);

                        if let Some(asset) = self.assets.get(&asset_id) {
                            self.finalize_reports(asset_id.clone(), &asset, reports);
                        }
                    }
                }
            }
        }
        env::log_str(&format!("Node operator removed: {}", operator_account));
    }

    fn internal_approve_code_hash(&mut self, code_hash: String) {
        self.approved_code_hashes.insert(&code_hash);
        env::log_str(&format!("Code hash approved: {}", code_hash));
    }

    fn internal_remove_code_hash(&mut self, code_hash: &String) {
        self.approved_code_hashes.remove(code_hash);
        self.approved_enclaves.remove(code_hash);
        env::log_str(&format!("Code hash removed: {}", code_hash));
    }

    fn internal_pause(&mut self) {
        self.paused = true;
        env::log_str("Oracle paused");
    }

    fn internal_resume(&mut self) {
        self.paused = false;
        env::log_str("Oracle resumed");
    }

    fn internal_update_config(
        &mut self,
        recency_threshold: Option<u64>,
        min_report_count: Option<u8>,
    ) {
        if let Some(threshold) = recency_threshold {
            self.recency_threshold = threshold;
        }
        if let Some(count) = min_report_count {
            self.min_report_count = count.max(1);
        }
        env::log_str("Configuration updated");
    }

    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can call this"
        );
    }

    fn update_aggregated_price(&mut self, asset_id: &str, reports: &[PriceReport]) {
        if reports.is_empty() {
            return;
        }

        // Calculate median price
        let mut prices: Vec<u128> = reports.iter().map(|r| r.price.multiplier).collect();
        prices.sort();

        let median = if prices.len() % 2 == 0 {
            (prices[prices.len() / 2 - 1] + prices[prices.len() / 2]) / 2
        } else {
            prices[prices.len() / 2]
        };

        // Get the most common decimals value
        let decimals = reports[0].price.decimals;

        // Get the latest timestamp
        let timestamp = reports.iter().map(|r| r.timestamp).max().unwrap_or(0);

        let aggregated = Price {
            multiplier: median,
            decimals,
            timestamp,
        };

        self.aggregated_prices
            .insert(&asset_id.to_string(), &aggregated);
    }

    fn finalize_reports(&mut self, asset_id: String, asset: &Asset, mut reports: Vec<PriceReport>) {
        if self.recency_threshold > 0 {
            let minimum_timestamp = env::block_timestamp().saturating_sub(self.recency_threshold);
            reports.retain(|r| r.timestamp >= minimum_timestamp);
        }

        if reports.is_empty() {
            self.price_reports.remove(&asset_id);
            self.aggregated_prices.remove(&asset_id);
            env::log_str(&format!("No fresh reports for {}", asset_id));
            return;
        }

        let required_sources = std::cmp::max(
            std::cmp::max(self.min_report_count as usize, asset.min_sources as usize),
            1,
        );

        if reports.len() < required_sources {
            self.price_reports.insert(&asset_id, &reports);
            self.aggregated_prices.remove(&asset_id);
            env::log_str(&format!(
                "Insufficient fresh reports for {} (have {}, need {})",
                asset_id,
                reports.len(),
                required_sources
            ));
        } else {
            self.price_reports.insert(&asset_id, &reports);
            self.update_aggregated_price(&asset_id, &reports);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    #[test]
    fn test_initialization() {
        let context = get_context(accounts(0));
        testing_env!(context.build());

        let contract = Oracle::new(accounts(0), 300_000_000_000, 3);
        assert_eq!(contract.owner, accounts(0));
        assert_eq!(contract.recency_threshold, 300_000_000_000);
        assert_eq!(contract.min_report_count, 3);
        assert_eq!(contract.attestation_max_age, 600_000_000_000);
        assert_eq!(contract.admin_timelock_delay, 0);
        assert_eq!(contract.admin_quorum_bps, 5000);
        assert_eq!(contract.proposal_counter, 0);
    }

    #[test]
    fn test_add_asset() {
        let context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 3);

        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 3,
        };

        contract.add_asset(asset);

        let assets = contract.get_assets();
        assert_eq!(assets.len(), 1);
        assert_eq!(assets[0].id, "near");
    }

    #[test]
    fn test_node_registration_flow() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 3);

        // Add operator
        contract.add_node_operator(accounts(1));

        // Approve code hash
        let code_hash = "test_hash_123".to_string();
        contract.approve_code_hash(code_hash.clone());
        contract.approve_attestation(code_hash.clone(), "mr_hash".to_string());

        // Operator sets node account
        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        // Node registers
        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.register_node(
            code_hash,
            AttestationData {
                mr_enclave: "mr_hash".to_string(),
                issued_at: env::block_timestamp(),
            },
        );

        // Verify node is authorized
        assert!(contract.is_authorized(accounts(2)));
    }

    #[test]
    fn test_price_reporting_and_aggregation() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 1);

        // Setup
        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 1,
        };
        contract.add_asset(asset);

        // Register two nodes
        contract.add_node_operator(accounts(1));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: env::block_timestamp(),
            },
        );

        // Report price from node 1
        contract.report_price("near".to_string(), 35000, 4); // $3.5000

        // Check price
        let price_data = contract.get_price("near".to_string());
        assert!(price_data.is_some());
        let price = price_data.unwrap();
        assert_eq!(price.price.multiplier, 35000);
        assert_eq!(price.price.decimals, 4);
    }

    #[test]
    fn test_price_requires_minimum_sources() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 2);

        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 2,
        };
        contract.add_asset(asset);

        contract.add_node_operator(accounts(1));
        contract.add_node_operator(accounts(2));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(3));
        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.set_node_account(accounts(4));

        context.predecessor_account_id(accounts(3));
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: env::block_timestamp(),
            },
        );
        context.predecessor_account_id(accounts(4));
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: env::block_timestamp(),
            },
        );

        // Only one report -> should not set aggregated price
        context.predecessor_account_id(accounts(3));
        testing_env!(context.build());
        contract.report_price("near".to_string(), 35000, 4);
        assert!(contract.get_price("near".to_string()).is_none());

        // Second node reports -> aggregation allowed
        context.predecessor_account_id(accounts(4));
        testing_env!(context.build());
        contract.report_price("near".to_string(), 36000, 4);
        let price = contract
            .get_price("near".to_string())
            .expect("price available");
        assert_eq!(price.num_sources, 2);
        assert_eq!(price.price.multiplier, 35500); // median of 35000 and 36000
    }

    #[test]
    fn test_price_becomes_stale_after_threshold() {
        let mut context = get_context(accounts(0));
        context.block_timestamp(1_000_000_000);
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 100, 1);

        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 1,
        };
        contract.add_asset(asset);

        contract.add_node_operator(accounts(1));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        context.predecessor_account_id(accounts(2));
        context.block_timestamp(1_000_000_050);
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: env::block_timestamp(),
            },
        );
        contract.report_price("near".to_string(), 35000, 4);

        // Advance time beyond recency threshold
        let mut view_context = get_context(accounts(0));
        view_context.block_timestamp(1_000_000_200);
        testing_env!(view_context.build());

        assert!(contract.get_price("near".to_string()).is_none());
    }

    #[test]
    #[should_panic(expected = "Attestation measurement mismatch")]
    fn test_register_node_rejects_wrong_attestation() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 1);
        contract.add_node_operator(accounts(1));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "wrong_hash".to_string(),
                issued_at: env::block_timestamp(),
            },
        );
    }

    #[test]
    #[should_panic(expected = "Attestation expired")]
    fn test_register_node_rejects_expired_attestation() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 1);
        contract.attestation_max_age = 100;
        contract.add_node_operator(accounts(1));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        context.predecessor_account_id(accounts(2));
        context.block_timestamp(1_000);
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: 0,
            },
        );
    }

    #[test]
    #[should_panic(expected = "Decimals mismatch with asset definition")]
    fn test_report_price_rejects_decimal_mismatch() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 1);

        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 1,
        };
        contract.add_asset(asset);

        contract.add_node_operator(accounts(1));
        contract.approve_code_hash("hash1".to_string());
        contract.approve_attestation("hash1".to_string(), "mr_hash1".to_string());

        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.set_node_account(accounts(2));

        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.register_node(
            "hash1".to_string(),
            AttestationData {
                mr_enclave: "mr_hash1".to_string(),
                issued_at: env::block_timestamp(),
            },
        );

        contract.report_price("near".to_string(), 35000, 2);
    }

    #[test]
    fn test_admin_proposal_flow() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 1);
        contract.configure_admin_role(vec![accounts(1)], vec![accounts(1), accounts(2)], 0, 5000);

        // Proposer creates action
        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.propose_action(AdminAction::ApproveCodeHash {
            code_hash: "governance_hash".to_string(),
        });
        let proposal_id = contract.proposal_counter;

        // Second voter approves
        context.predecessor_account_id(accounts(2));
        testing_env!(context.build());
        contract.approve_proposal(proposal_id);

        // Execute proposal
        context.predecessor_account_id(accounts(1));
        testing_env!(context.build());
        contract.execute_proposal(proposal_id);

        assert!(contract
            .approved_code_hashes
            .contains(&"governance_hash".to_string()));
        assert!(contract.list_proposals().is_empty());
    }

    #[test]
    #[should_panic(expected = "Not an authorized node")]
    fn test_unauthorized_price_report() {
        let context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 3);

        let asset = Asset {
            id: "near".to_string(),
            symbol: "NEAR".to_string(),
            name: "NEAR Protocol".to_string(),
            decimals: 4,
            active: true,
            min_sources: 3,
        };
        contract.add_asset(asset);

        // Try to report without being authorized
        contract.report_price("near".to_string(), 35000, 4);
    }

    #[test]
    fn test_pause_functionality() {
        let context = get_context(accounts(0));
        testing_env!(context.build());

        let mut contract = Oracle::new(accounts(0), 300_000_000_000, 3);

        contract.pause();
        assert!(contract.paused);

        contract.resume();
        assert!(!contract.paused);
    }
}
