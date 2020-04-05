'use strict';

const validator = require('validator');

module.exports = {
    validateForm(req) {
        const { cc, cvv, expire, amount } = req.body;

        const errors = [];

        if(!validator.isCreditCard(cc)) {
            errors.push({
                param: 'cc',
                msg: 'Invalid credit card number.'
            });
        }

        if(!/^\d{3}$/.test(cvv)) {
            errors.push({
                param: 'cvv',
                msg: 'Invalid CVV code.'
            });
        }

        if(!/^\d{4}$/.test(expire)) {
            errors.push({
                param: 'expire',
                msg: 'Invalid expiration date.'
            }); 
        }

        if(!validator.isDecimal(amount)) {
            errors.push({
                param: 'amount',
                msg: 'Invalid amount.'
            }); 
        }

        return errors;
    }
};