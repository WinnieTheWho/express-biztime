const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db")


router.get('/', async function (req, res, next) {
  try {
    const results = await db.query(`SELECT code, name FROM companies`)
    return res.json({ companies: results.rows });
  }
  catch (err) {
    return next(err);
  }
})

router.get('/:code', async function (req, res, next) {
  try {
    const oneCode = req.params.code

    const results = await db.query(
      `SELECT code, name, description
             FROM companies 
             WHERE code=$1`, [oneCode])
    
    if (!results.rows[0]) {
      throw new ExpressError("No such company!", 404);
    }

    return res.json({ company: results.rows[0] })
  } catch (err) {
    return next(err);
  }
})

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  }
  catch (err) {
    return next(err)
  }
})

router.put("/:code", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      `UPDATE companies 
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
      [name, description, req.params.code]
    );

    if (!result.rows[0]) {
      throw new ExpressError("No such company!", 404);
    }

    return res.json({ company: result.rows[0] });
  }
  catch (err) {
    return next(err)
  }
})

router.delete("/:code", async function (req, res, next) {
  try {
    const checkedCompany = await db.query(`SELECT code FROM companies WHERE code=$1`, 
                                         [req.params.code])
    if(!checkedCompany.rows[0]){
    throw new ExpressError('Invoice does not exist', 404)      
    }

    const result = await db.query(
      `DELETE FROM companies WHERE code=$1`,
      [req.params.code]
    );

    return res.json({status: "deleted"});
  }
  catch (err) {
    return next(err)
  }
})

module.exports = router; 