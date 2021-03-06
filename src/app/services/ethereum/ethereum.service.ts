import { Injectable } from '@angular/core';
import multihash from "multi-hash";
import { ContractProviderService } from "../contract-provider/contract-provider.service";
declare var Web3: any;

@Injectable()
export class EthereumService {

  // The web3 connection to ethereum
  private _web3: any = null;
  // The password for the default ethereum account
  private _accountPassword: string = null;
  // A test contract (if deployed)
  private testContract: any;
  // User contract address
  private userContractAddress: string;

  private _userContract: any = null;

  constructor() {
  }

  get web3(): any {
    return this._web3;
  }

  get userContract(): any {
    return this._userContract;
  }

  /**
   * Initializes the web3 connection to the given ethereum provider.
   * @param provider The ethereum client provider. Typically a string like "http://localhost:8545"
   * @param accountPassword The password for the default ethereum account. It will be used when you want to unlock the account later.
   * @returns {Promise<T>} Returns a promise that resolves the web3 object it is connected to the ethereum client.
   */
  initWeb3(provider: string = "http://localhost:8545", accountPassword: string = "pw0"): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 == null) {
        let httpProvider = new (<any>Web3).providers.HttpProvider(provider);
        this._web3 = new Web3(httpProvider);
        this._web3.eth.defaultAccount = this._web3.eth.accounts[0];
        this._accountPassword = accountPassword;

        console.log(this._web3);

        this.unlockDefaultAccount().then(unlockResult => {
          // Get user registration contract
          let userRegistrationContract = this.web3.eth.contract(ContractProviderService.USER_REGISTRY_CONTRACT_ABI)
            .at(ContractProviderService.USER_REGISTRY_CONTRACT_ADDRESS);
          this.userContractAddress = userRegistrationContract.userContracts(this._web3.eth.defaultAccount);

          // Only deploy contractAddress if the user does not already have one
          if (this.userContractAddress.match("0x0*$")) {
            this.deployContract(ContractProviderService.USER_CONTRACT_ABI, ContractProviderService.USER_CONTRACT_BINARY).then(contractAddress => {
              let result = userRegistrationContract.setUserContractAddress(contractAddress);
              this.userContractAddress = contractAddress;
              console.log("New user contract address: " + this.userContractAddress);
            }).catch(err => {
              console.log(err);
            });
          } else {
            console.log("Old user contract address: " + this.userContractAddress);
          }
          this._userContract = this.web3.eth.contract(ContractProviderService.USER_CONTRACT_ABI).at(this.userContractAddress);
          console.log(this._userContract);
        }).catch(unlockErr => {
          console.log(unlockErr);
        });

        resolve(this._web3);
      } else {
        resolve(this._web3);
      }
    });
    return promise;
  }

  editUserAccount(fund:number, publicKey:string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.userContract.setPublicKey(publicKey, {gas: 5000000}, (err, res) => {
        if (err || !res) {
          reject(new Error("ethereum user contrac error" + err + res));
        } else {
          this.userContract.fund({value:fund}, (fundErr, fundRes) => {
            if (fundErr || !fundRes) {
              reject(new Error("ethereum user contrac error" + fundErr + fundRes));
            } else {
              console.log(res);
              console.log(fundRes);
              resolve(this.userContract);
            }
          });
        }
      });
    });
  }

  deployContract(contractAbi, compiledContract): Promise<string> {
    return new Promise((resolve, reject) => {
      let count = 0;
      this._web3.eth.contract(contractAbi).new({data: compiledContract, gas: 7000000}, (err, contract) => {
        // callback fires twice, we only want the second call when the contract is deployed
        count = count + 1;
        if (count == 2) {
          if (err != null) {
            reject(err);
          } else if (contract.address) {
            let myContract = contract;
            resolve(myContract.address);
          }
        }
      });
    });
  }

  /**
   * Unlocks the default ethereum account with the password provided at the beginning (when initializing
   * the connection to the ethereum client).
   * @returns {Promise<T>} Returns a promise that resolves the web3 object as soon as the account is unlocked.
   */
  unlockDefaultAccount(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null && this._accountPassword != null) {
        this._web3.personal.unlockAccount(this._web3.eth.defaultAccount, this._accountPassword, 999, (error, result) => {
          if (!error) {
            resolve(result);
          }
          else {
            console.error(error);
            reject(error);
          }
        });
      } else {
        reject(new Error("Account password not set or no connection to ethereum client"));
      }
    });
    return promise;
  }

  /**
   * Creates and deploys an ethereum contract to the blockchain. To use this method, you need to have the
   * solidity compiler (solc) installed and in your systems path variable.
   * @param contractSource The solidity source code as a string.
   * @returns {Promise<T>} Returns a promise that resolves the contract as soon as it is mined.
   */
  createContract(contractSource: string): Promise<any> {

    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null) {
        let compiled = this._web3.eth.compile.solidity(contractSource);
        let code = compiled.test.code;
        // contract json abi, this is autogenerated using solc CLI
        let abi = compiled.test.info.abiDefinition;
        let myContract;

        // let's assume that coinbase is our account
        this._web3.eth.defaultAccount = this._web3.eth.coinbase;
        // create contract
        console.log("Contract status: " + "transaction sent, waiting for confirmation");
        this._web3.eth.contract(abi).new({ data: code }, (err, contract) => {
          console.log(code);
          if (err) {
            reject(err);
            return;
            // callback fires twice, we only want the second call when the contract is deployed
          } else if (contract.address) {
            myContract = contract;
            console.log("Contract status: " + "Mined");
            console.log('Contract address: ' + myContract.address);
            this.testContract = myContract;
            resolve(myContract);
          }
        });
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }

  /**
   * Creates and deploys a test contract to the blockchain. To use this method, you need to have the
   * solidity compiler (solc) installed and in your systems path variable.
   * @returns {Promise<T>} Returns a promise that resolves the contract as soon as it is mined.
   */
  createTestContract(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null) {
        // If no contract source set, we create a test contract
        let contractSource = "" +
          "contract test {\n" +
          "   function multiply(uint a) constant returns(uint d) {\n" +
          "       return a * 7;\n" +
          "   }\n" +
          "}\n";

        this.createContract(contractSource).then(res => {
          resolve(res);
        }).catch(err => {
          reject(err);
        });
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }

  /**
   * Calls the test contract that you can deploy with the createTestContract() above
   * @param param Number to multiply
   * @returns {Promise<T>} The contract multipies the number by 7 and returns the value as promise.
   */
  callTestContract(param: number): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null && this.testContract != null) {
        // call the contract
        let res = this.testContract.multiply(param);
        resolve(res.toString(10));
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }
}
