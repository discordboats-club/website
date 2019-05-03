/* eslint-disable */
const express = require("express");
const { r } = require('../ConstantStore');
const bodyParser = require("body-parser");
const certificationRoute = express.Router();

certificationRoute.use(bodyParser.json())

certificationRoute.post("/:id" , async (req,res) => {
    let bID = req.params.id;
    if(!bID) return res.json({success: false, message: "No Bot ID"});
    if(!req.body.sk || req.body.sk !== "daddynoobonaacz") return res.json({success: false,"message": "no u"});

    try {
        r.table('bots').filter({"id": bID}).update({ certified: true });
        res.json({sucess: true, message: "Updated Succesfully"});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
});

module.exports = certificationRoute;
