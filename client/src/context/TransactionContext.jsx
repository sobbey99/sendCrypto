import React, { useEffect, useState } from "react";
import { ethers, BrowserProvider, parseEther, formatUnits } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = async () => {
  if (typeof window.ethereum === "undefined") {
    console.error("Ethereum provider not found");
    return;
  }

  const provider = new BrowserProvider(ethereum);

  const signer = await provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );

  const [transactions, setTransactions] = useState([]);

  const handleChange = (e) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        [e.target.name]: e.target.value,
      };
    });
  };

  const convertTimestamp = (timestampBigInt) => {
    const timestamp = BigInt(timestampBigInt); // Convert the BigInt timestamp to a string

    // Convert the timestamp to a regular number
    const timestampNumber = Number(timestamp);

    // Create a new Date object using the timestamp multiplied by 1000 (to convert from seconds to milliseconds)
    const date = new Date(timestampNumber * 1000);

    // Extract the individual components (year, month, day, hour, minute, second) from the date
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Months are zero-based, so add 1
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    // Convert the hour to a 12-hour format
    const formattedHour = hour % 12 || 12; // If hour is 0, convert it to 12

    // Determine if it's AM or PM
    const amPm = hour < 12 ? "AM" : "PM";

    // Create the formatted date and time string
    const formattedDateTime = `${month}/${day}/${year}, ${formattedHour}:${minute}:${second} ${amPm}`;

    return formattedDateTime;
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert("Please install metamask");
      }
      const transactionContract = await getEthereumContract();

      const availableTransactions =
        await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: convertTimestamp(transaction.timestamp),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount) / 10 ** 18,
        })
      );

      console.log({ structuredTransactions });
      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        return alert("Please install metamask");
      }

      const accounts = await ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
      //   console.log(accounts);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const checkIfTransactionsExist = async () => {
    try {
      const transactionContract = await getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert("Please install metamask");
      }
      const { addressTo, amount, keyword, message } = formData;

      const transactionContract = await getEthereumContract();

      const parsedAmount = parseEther(amount.toString());

      // Convert the value to wei
      const valueInWei = formatUnits(parsedAmount, "wei");

      //   console.log({
      //     amount,
      //     valueInWei,
      //   });

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: "0x5208",
            value: valueInWei,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );
      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();

      setTransactionCount(transactionCount.toNumber());

      window.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert("Please install metamask");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);
  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        handleChange,
        sendTransaction,
        transactions,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
