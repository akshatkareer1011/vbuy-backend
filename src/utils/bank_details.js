const ifsc = require("ifsc");

const getBankDetails = async IFSC => {
  const isValidIFSC = ifsc.validate(IFSC);

  if (!isValidIFSC) {
    throw new Error("IFSC is invalid!");
  }

  try {
    const response = await ifsc.fetchDetails(IFSC);
    const bankDetails = {
      bank: response.BANK,
      branch: response.BRANCH,
      state: response.STATE,
    };
    return bankDetails;
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = getBankDetails;
