const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db")

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`)
    return res.json({ invoices: results.rows });
  }
  catch (err) {
    return next(err);
  }
})

router.get("/:id", async function(req, res, next) {
  try {
    // include comp_code to use it later on in companyResult
    // can delete it from the returned result later on, so don't worry about it 
    
    const invoiceResult = await db.query(`SELECT id, comp_code, amt, paid, 
                                         add_date, paid_date FROM invoices WHERE id=$1`,
                                         [req.params.id])

    // invoiceResult still has empty row even with invalid id 
    if (!invoiceResult.rows[0]) {
      throw new ExpressError("No such invoice!", 404);
    }

    const companyResult = await db.query(`SELECT code, name, description 
                                         FROM companies WHERE code=$1`,
                                         [invoiceResult.rows[0].comp_code])

    // need const result, can't dump into return statement bc adding company to it
    const result = invoiceResult.rows[0]


    // add company object into the returned result
    result.company = companyResult.rows[0]
    // remove comp_code in returned result
    delete result.comp_code;
    
    return res.json({ invoice: result });
  }
  catch (err) {
    return next(err);
  }
})

router.post("/", async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    // the rest of the values have default values preset in data.sql 
    // so that's why we're able to return them without errors
    
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  }
  catch (err) {
    return next(err)
  }
}
)

router.put("/:id", async function(req, res, next) {
  try {
    const { amt } = req.body;

    const result = await db.query(
      `UPDATE invoices
       SET amt=$1
       WHERE id=$2
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
       [amt, req.params.id]
    );

    if (!result.rows[0]) {
      throw new ExpressError("No such invoice!", 404);
    }

    return res.json({ invoice: result.rows[0] });
  }
  catch (err) {
    // we have two error messages bc of line 26-28 in app.js
    // they want to return 2 error messages
    return next(err)
  }
})

router.delete("/:id", async function(req, res, next) {
  try {

    //returning an id differentiates if an id was deleted or not 
    const result = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING id`,
      [req.params.id]
    );

    if(result.rows.length === 0) {
      throw new ExpressError('Invoice does not exist', 404)      
    }

    return res.json({status: "deleted"});
  }
  catch (err) {
    return next(err)
  }
})

module.exports = router; 