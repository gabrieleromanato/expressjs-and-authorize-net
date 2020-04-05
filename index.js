'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');


const { loginId, transactionKey } = require('./config');
const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;
const SDKConstants = require('authorizenet').Constants;

const app = express();
const port = process.env.PORT || 3000;
const { validateForm } = require('./lib');

app.disable('x-powered-by');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/checkout', (req, res) => {
    const validationErrors = validateForm(req);

    if(validationErrors.length > 0) {
        res.json({ errors: validationErrors });
        return;
    }

    const { cc, cvv, expire, amount } = req.body;

    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(loginId);
    merchantAuthenticationType.setTransactionKey(transactionKey);
    
    const creditCard = new ApiContracts.CreditCardType();
	creditCard.setCardNumber(cc);
	creditCard.setExpirationDate(expire);
    creditCard.setCardCode(cvv);
    
    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionSetting = new ApiContracts.SettingType();
	transactionSetting.setSettingName('recurringBilling');
    transactionSetting.setSettingValue('false');
    
    const transactionSettingList = [];
    transactionSettingList.push(transactionSetting);
    
    const transactionSettings = new ApiContracts.ArrayOfSetting();
	transactionSettings.setSetting(transactionSettingList);
    
    const transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setPayment(paymentType);
	transactionRequestType.setAmount(amount);
    transactionRequestType.setTransactionSettings(transactionSettings);
    
    const createRequest = new ApiContracts.CreateTransactionRequest();
	createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);
    
    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

    ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if(response !== null) {
            if(response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
                if(response.getTransactionResponse().getMessages() !== null) {
                    res.json({ success: 'Transaction was successful.' });
                } else {
                    if(response.getTransactionResponse().getErrors() !== null) {
                        let code = response.getTransactionResponse().getErrors().getError()[0].getErrorCode();
                        let text = response.getTransactionResponse().getErrors().getError()[0].getErrorText();
                        res.json({
                            error: `${code}: ${text}`
                        });
                    } else {
                        res.json({ error: 'Transaction failed.' });
                    }
                }    
            } else {
                if(response.getTransactionResponse() !== null && response.getTransactionResponse().getErrors() !== null){
                    let code = response.getTransactionResponse().getErrors().getError()[0].getErrorCode();
                    let text = response.getTransactionResponse().getErrors().getError()[0].getErrorText();
                    res.json({
                        error: `${code}: ${text}`
                    });
                } else {
                    let code = response.getMessages().getMessage()[0].getCode();
                    let text = response.getMessages().getMessage()[0].getText();
                    res.json({
                        error: `${code}: ${text}`
                    });
                }   
            }    

        } else {
            res.json({ error: 'No response.' });
        }
    });
});


app.listen(port);