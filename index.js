import fs from "fs";
import path from "fs";

import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import "dotenv/config";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchserver = async (ccArray) => {
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(
      new chrome.Options().addArguments([
        "--no-sandbox",
        "--window-size=1920,1080",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
      ])
    )
    .build();
  console.log(process.env.ADDRESS_COUNTRY);
  await driver.get(`https://www.xbox.com/en-${process.env.ADDRESS_COUNTRY}`);
  await driver
    .wait(until.elementLocated(By.id("mectrl_headerPicture")), 7000)
    .click();
  await driver
    .wait(until.elementLocated(By.id("i0116")), 7000)
    .sendKeys(process.env.XBOX_ACCOUNT_EMAIL);
  await driver.wait(until.elementLocated(By.id("idSIButton9")), 7000).click();
  await driver
    .wait(until.elementLocated(By.id("i0118")), 7000)
    .sendKeys(process.env.XBOX_ACCOUNT_PASS);
  await delay(2000);
  await driver.findElement(By.id("idSIButton9")).click();
  await driver.wait(until.elementLocated(By.id("idSIButton9")), 7000).click();
  await delay(5000);
  await driver.get(`https://www.xbox.com/en-SG/wishlist`);

  // Sometimes Xbox shows an additional sign in to view wishlist page
  /*  try {
    await driver
      .wait(until.elementsLocated(By.css("btn-primary")), 7000)
      .click();
  } catch (error) {}
*/
  await driver
    .wait(
      until.elementLocated(
        By.className("WishListActionButtons-module__button___1GItq")
      ),
      7000
    )
    .click();
  await driver
    .wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'NEXT')]")),
      7000
    )
    .click();

  // Purchases are done via an iframe
  let purchaseIFrame = await driver.wait(
    until.elementLocated(By.name("purchase-sdk-hosted-iframe")),
    7000
  );
  await driver.switchTo().frame(purchaseIFrame);
  await delay(5000);

  // Check if there is any saved card on account , if yes add a new card
  try {
    await driver.wait(
      until.elementsLocated(By.css(".paymentOption--QYaNFqhl")),
      100000
    );
    console.log("Adding new payment method");
    await driver.findElement(By.css(".paymentOption--QYaNFqhl")).click();
    await delay(2000);
    await driver
      .wait(
        until.elementLocated(
          By.css("div.paymentOptionList--qjb4eaXb > div > button")
        ),
        7000
      )
      .click();
  } catch (err) {
    console.log(err);
  }

  // IF no cards added add new one
  try {
    await driver
      .wait(
        until.elementLocated(
          By.css("optionContainer--rAUcGmBZ.lightweight--pJD1bYoI.base--mMLxCpsV")
        ),
        7000
      )
      .click();
  } catch (err) {
    console.log(err);
  }

  // Some regions do not support Discover Cards
  try {
    if (
      await driver.wait(
        until.elementsLocated(By.id("id_credit_card_visa_amex_mc_discover")),
        5000
      )
    )
      await driver
        .wait(
          until.elementsLocated(By.id("id_credit_card_visa_amex_mc_discover"))
        )
        .click();
    else
      await driver
        .wait(until.elementLocated(By.id("id_credit_card_visa_amex_mc")))
        .click();
  } catch (error) {
    console.log(error);
  }

  let purchaseState = "NA";

  do {
    const rand = Math.floor(Math.random() * ccArray.length);

    //Adding CC details
    let ccNum = ccArray[rand].split("|")[0];
    const ccField = await driver.wait(
      until.elementLocated(By.css("#accountToken")),
      10000
    );
    await ccField.clear();
    await ccField.sendKeys(ccNum);

    const nameField = await driver.findElement(By.css("#accountHolderName"));
    await nameField.clear();
    await nameField.sendKeys(process.env.CC_HOLDER_NAME);

    let ccMonth = ccArray[rand].split("|")[1];
    await driver.findElement(By.css("#input_expiryMonth")).sendKeys(ccMonth);

    let ccYear = ccArray[rand].split("|")[2].slice(2);
    await driver.findElement(By.css("#input_expiryYear")).sendKeys(ccYear);

    let ccCVV = ccArray[rand].split("|")[3];
    const cvvField = await driver.findElement(By.css("#cvvToken"));
    await cvvField.clear();
    await cvvField.sendKeys(ccCVV);

    const addrField = await driver.findElement(By.css("#address_line1"));
    await addrField.clear();
    await addrField.sendKeys(process.env.ADDRESS_LINE_1);

    const cityField = await driver.findElement(By.css("#city"));
    await cityField.clear();
    await cityField.sendKeys(process.env.ADDRESS_CITY);

    // State / Region field isn't shown for some countries
    if (process.env.ADDRESS_STATE) {
      await driver
        .findElement(By.css("#input_region"))
        .sendKeys(process.env.ADDRESS_STATE);
    }

    const zipField = await driver.findElement(By.css("#postal_code"));
    await zipField.clear();
    await zipField.sendKeys(process.env.ADDRESS_ZIP);

    await driver.findElement(By.css("#pidlddc-button-saveButton")).click();

    // Status checking
    // Check card is invalid
    try {
      if (await driver.findElement(By.css("#pidlddc-error-accountToken"))) {
        purchaseState = "cardNotAdded";
        ccArray.splice(rand, 1);
        continue;
      }
    } catch (error) {
      console.log(error);
    }
    // Check is CVV is incorrect
    try {
      if (await driver.findElement(By.css("#pidlddc-error-cvvToken"))) {
        purchaseState = "cvvError";
        ccArraysplice(rand, 1);
        continue;
      }
    } catch (error) {
      console.log(error);
    }

    // Card got added
    try {
      await driver.wait(
        until.elementLocated(By.css(".paymentOption--QYaNFqhl")),
        7000
      );
      await driver.wait(
        until.elementLocated(By.css("button.primary--omlCc+01.base--mMLxCpsV"))
      );
      const regonErr = await driver.wait(
        until.elementsLocated(
          By.xpath(
            "//div[contains(text() , 'The region in which your payment option was issued and your Store region need to match. ')]"
          ),
          7000
        )
      );
      if (regonErr) {
        console.warn("Region of card and store doesn't match");
        process.exit(1);
      }
      /*
      else {
        console.info("Payment Successfull (most likely)");
        process.exit(1);
      }
      */
    } catch {}
    // Validation failed
    try {
      await driver.wait(
        until.elementLocated(By.css("div.errorContainer--rKH3vwH8")),
        10000
      );
      purchaseState = "validationFailed";
      ccArray.splice(rand, 1);
      await driver.findElement(By.css("button.mainButton--uvboG-Qx")).click();
      await driver
        .wait(
          until.elementLocated(
            By.css("button.paymentOptionContainer--JwA3BDr2")
          ),
          7000
        )
        .click();
      await driver
        .wait(until.elementLocated(By.id("id_credit_card_visa_amex_mc")), 7000)
        .click();
      continue;
    } catch (error) {
      console.log(error);
    }
  } while (purchaseState !== "Succeded");
};

fs.readFile("./sample.txt", "utf8", function (err, data) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  var ccArray = data.split("\n");

  process.on("SIGINT", () => {
    console.info("SIGINT signal received.");
    let file = fs.createWriteStream("./sample.txt");
    file.on("error", () => {
      console.warn("Failed to update ccs");
      process.exit(1);
    });
    ccArray.map((cc) => file.write(cc));
    file.end();
    process.exit(1);
  });

  fetchserver(ccArray);
});
