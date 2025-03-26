CREATE TABLE IF NOT EXISTS USERS (
    userID INT NOT NULL,
    firstName VARCHAR(25) NOT NULL,
    lastName VARCHAR(25) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    passwd VARCHAR(72) NOT NULL,
    mobile_no VARCHAR(10) NOT NULL,
    tokens JSON NOT NULL,
    otp VARCHAR(6),
    PRIMARY KEY (userID)
);

CREATE TABLE IF NOT EXISTS OTP_VERIFICATION (
    id INT AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL UNIQUE, 
    OTP VARCHAR(6) NOT NULL,
    EXPIRES_AT VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS USER_ADDRESS (
    addressID VARCHAR(25) NOT NULL,
    userID INT NOT NULL,
    street VARCHAR(30) NOT NULL,
    city VARCHAR(30) NOT NULL,
    state_ VARCHAR(30) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    PRIMARY KEY (addressID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BOOKS (
    isbn VARCHAR(13) NOT NULL,
    title VARCHAR(50) NOT NULL,
    author JSON NOT NULL,
    publication VARCHAR(50) NOT NULL,
    published VARCHAR(10) NOT NULL,
    mrp DECIMAL,
    costPrice DECIMAL,
    stock INT NOT NULL,
    PRIMARY KEY (isbn)
);

CREATE TABLE IF NOT EXISTS CART (
    cartID VARCHAR(25) NOT NULL,
    userID INT NOT NULL,
    isbn JSON NOT NULL,
    quantity JSON NOT NULL,
    costPrice JSON NOT NULL,
    cartTotal DECIMAL NOT NULL,
    cartStatus ENUM('empty', 'full') NOT NULL,
    PRIMARY KEY (cartID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ORDERS (
    orderID VARCHAR(25) NOT NULL,
    userID INT NOT NULL,
    cartID VARCHAR(30) NOT NULL,
    item_count INT NOT NULL,
    orderTotal DECIMAL NOT NULL,
    orderDate VARCHAR(100) NOT NULL,
    orderStatus ENUM('Confirmed', 'Completed', 'Cancelled') NOT NULL,
    PRIMARY KEY (orderID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE,
    FOREIGN KEY (cartID) REFERENCES CART(cartID)
);

CREATE TABLE IF NOT EXISTS PAYMENTS (
    paymentID VARCHAR(25) NOT NULL,
    transactionID INT,
    userID INT NOT NULL,
    orderID VARCHAR(25),
    paymentStatus ENUM('Completed', 'Processing'),
    PRIMARY KEY (paymentID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE,
    FOREIGN KEY (orderID) REFERENCES ORDERS(orderID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BANK_ACCOUNT (
    accountID VARCHAR(25) NOT NULL,
    contact_id VARCHAR(30),
    fund_account_id VARCHAR(30),
    userID INT NOT NULL,
    vpaID VARCHAR(50),
    accountNumber VARCHAR(30),
    ifsc VARCHAR(11),
    bank VARCHAR(100),
    accountHolderName VARCHAR(30),
    PRIMARY KEY (accountID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SHIPPING (
    shippingID INT NOT NULL,
    ship_orderID INT,
    orderID VARCHAR(25) NOT NULL,
    addressID VARCHAR(25) NOT NULL,
    AWBnumber VARCHAR(25),
    AWB_transporter VARCHAR(30),
    invoiceLink VARCHAR(150),
    shippingStatus ENUM('In transit', 'Delivered'),
    PRIMARY KEY (shippingID),
    FOREIGN KEY (orderID) REFERENCES ORDERS(orderID) ON DELETE CASCADE,
    FOREIGN KEY (addressID) REFERENCES USER_ADDRESS(addressID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SUPPORT (
    ticketID VARCHAR(30) NOT NULL,
    userID INT NOT NULL,
    issueSubject VARCHAR(255) NOT NULL,
    issueMessage TEXT NOT NULL,
    replyMessage TEXT,
    ticketStatus ENUM ('Open', 'Closed') NOT NULL,
    PRIMARY KEY (ticketID),
    FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
);