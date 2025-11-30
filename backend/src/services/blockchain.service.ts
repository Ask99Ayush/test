import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  SimpleTransaction,
  generateTransaction,
  signAndSubmitTransaction
} from '@aptos-labs/ts-sdk';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

export interface BlockchainTransaction {
  hash: string;
  success: boolean;
  gasUsed: string;
  blockHeight: string;
  timestamp: string;
}

export interface CarbonCreditData {
  amount: number;
  vintage: number;
  creditType: string;
  projectName: string;
  location: string;
  standard: string;
  verificationData: any;
}

export interface MarketplaceOrderData {
  orderType: 'buy' | 'sell';
  amount: number;
  pricePerCredit: number;
  creditType?: string;
  vintage?: number;
  location?: string;
  standard?: string;
}

export class BlockchainService {
  private aptos: Aptos;
  private account: Account;
  private config: AptosConfig;

  constructor() {
    // Initialize Aptos configuration
    this.config = new AptosConfig({
      network: config.aptosNodeUrl.includes('devnet') ? Network.DEVNET :
               config.aptosNodeUrl.includes('testnet') ? Network.TESTNET : Network.MAINNET
    });

    this.aptos = new Aptos(this.config);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize account from private key
      const privateKey = new Ed25519PrivateKey(config.aptosPrivateKey);
      this.account = Account.fromPrivateKey({ privateKey });

      // Verify account and connection
      const accountData = await this.aptos.getAccountInfo({
        accountAddress: this.account.accountAddress
      });

      logger.info(`✅ Blockchain service initialized successfully`);
      logger.info(`📍 Account Address: ${this.account.accountAddress.toString()}`);
      logger.info(`💰 Account Sequence Number: ${accountData.sequence_number}`);

    } catch (error) {
      logger.error('❌ Failed to initialize blockchain service:', error);
      throw new Error('Blockchain service initialization failed');
    }
  }

  // Carbon Credit Contract Functions
  async mintCarbonCredit(
    recipientAddress: string,
    creditData: CarbonCreditData
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.carbonCreditContractAddress}::CarbonCredit::mint_credit`,
          functionArguments: [
            recipientAddress,
            creditData.amount.toString(),
            creditData.vintage,
            creditData.creditType,
            creditData.projectName,
            creditData.location,
            creditData.standard,
            JSON.stringify(creditData.verificationData)
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Carbon credit minted: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0', // Will be filled from transaction receipt
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to mint carbon credit:', error);
      throw new Error(`Failed to mint carbon credit: ${error.message}`);
    }
  }

  async transferCarbonCredit(
    creditId: string,
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.carbonCreditContractAddress}::CarbonCredit::transfer_credit`,
          functionArguments: [
            fromAddress,
            toAddress,
            creditId,
            amount.toString()
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Carbon credit transferred: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to transfer carbon credit:', error);
      throw new Error(`Failed to transfer carbon credit: ${error.message}`);
    }
  }

  async retireCarbonCredit(
    creditId: string,
    ownerAddress: string,
    amount: number,
    retirementReason: string
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.carbonCreditContractAddress}::CarbonCredit::retire_credit`,
          functionArguments: [
            ownerAddress,
            creditId,
            amount.toString(),
            retirementReason
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Carbon credit retired: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to retire carbon credit:', error);
      throw new Error(`Failed to retire carbon credit: ${error.message}`);
    }
  }

  // Marketplace Contract Functions
  async placeBuyOrder(
    userAddress: string,
    orderData: MarketplaceOrderData
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.marketplaceContractAddress}::Marketplace::place_buy_order`,
          functionArguments: [
            userAddress,
            orderData.amount.toString(),
            (orderData.pricePerCredit * 1000000).toString(), // Convert to micro-APT
            orderData.creditType || '',
            orderData.vintage || 0,
            orderData.location || '',
            orderData.standard || ''
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Buy order placed: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to place buy order:', error);
      throw new Error(`Failed to place buy order: ${error.message}`);
    }
  }

  async placeSellOrder(
    userAddress: string,
    creditId: string,
    orderData: MarketplaceOrderData
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.marketplaceContractAddress}::Marketplace::place_sell_order`,
          functionArguments: [
            userAddress,
            creditId,
            orderData.amount.toString(),
            (orderData.pricePerCredit * 1000000).toString() // Convert to micro-APT
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Sell order placed: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to place sell order:', error);
      throw new Error(`Failed to place sell order: ${error.message}`);
    }
  }

  async executeTrade(
    buyOrderId: string,
    sellOrderId: string,
    amount: number
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.marketplaceContractAddress}::Marketplace::execute_trade`,
          functionArguments: [
            buyOrderId,
            sellOrderId,
            amount.toString()
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Trade executed: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to execute trade:', error);
      throw new Error(`Failed to execute trade: ${error.message}`);
    }
  }

  // Certificate Contract Functions
  async issueCertificate(
    recipientAddress: string,
    certificateType: string,
    title: string,
    description: string,
    metadata: any,
    expirationDays?: number
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.certificateContractAddress}::CertificateRegistry::issue_certificate`,
          functionArguments: [
            recipientAddress,
            certificateType,
            title,
            description,
            JSON.stringify(metadata),
            expirationDays ? expirationDays.toString() : '0'
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Certificate issued: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to issue certificate:', error);
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  // Reputation Contract Functions
  async updateReputationScore(
    userAddress: string,
    category: string,
    scoreChange: number,
    reason: string
  ): Promise<BlockchainTransaction> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.reputationContractAddress}::ReputationSystem::update_score`,
          functionArguments: [
            userAddress,
            category,
            scoreChange.toString(),
            reason
          ]
        }
      });

      const response = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      await this.aptos.waitForTransaction({ transactionHash: response.hash });

      logger.info(`✅ Reputation score updated: ${response.hash}`);

      return {
        hash: response.hash,
        success: true,
        gasUsed: '0',
        blockHeight: '0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to update reputation score:', error);
      throw new Error(`Failed to update reputation score: ${error.message}`);
    }
  }

  // Query Functions
  async getCreditInfo(creditId: string): Promise<any> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${config.carbonCreditContractAddress}::CarbonCredit::get_credit_info`,
          functionArguments: [creditId]
        }
      });

      return response[0];
    } catch (error) {
      logger.error('❌ Failed to get credit info:', error);
      throw new Error(`Failed to get credit info: ${error.message}`);
    }
  }

  async getMarketStats(): Promise<any> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${config.marketplaceContractAddress}::Marketplace::get_market_stats`,
          functionArguments: []
        }
      });

      return response[0];
    } catch (error) {
      logger.error('❌ Failed to get market stats:', error);
      throw new Error(`Failed to get market stats: ${error.message}`);
    }
  }

  async getUserPortfolio(userAddress: string): Promise<any> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${config.carbonCreditContractAddress}::CarbonCredit::get_portfolio_info`,
          functionArguments: [userAddress]
        }
      });

      return response[0];
    } catch (error) {
      logger.error('❌ Failed to get user portfolio:', error);
      throw new Error(`Failed to get user portfolio: ${error.message}`);
    }
  }

  async getReputationInfo(userAddress: string): Promise<any> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${config.reputationContractAddress}::ReputationSystem::get_reputation_info`,
          functionArguments: [userAddress]
        }
      });

      return response[0];
    } catch (error) {
      logger.error('❌ Failed to get reputation info:', error);
      throw new Error(`Failed to get reputation info: ${error.message}`);
    }
  }

  // Utility Functions
  async getAccountBalance(accountAddress: string): Promise<string> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress
      });

      const coinStore = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (coinStore) {
        return (coinStore.data as any).coin.value;
      }

      return '0';
    } catch (error) {
      logger.error('❌ Failed to get account balance:', error);
      return '0';
    }
  }

  async getTransactionDetails(transactionHash: string): Promise<any> {
    try {
      const transaction = await this.aptos.getTransactionByHash({
        transactionHash
      });

      return transaction;
    } catch (error) {
      logger.error('❌ Failed to get transaction details:', error);
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.aptos.getLedgerInfo();
      return true;
    } catch (error) {
      logger.error('Blockchain service health check failed:', error);
      return false;
    }
  }
}