/**
 * @NApiVersion 2.1
 */
define([], () => {
  
  const QUERIES = {};
  QUERIES.LOT_INFORMATION = "SELECT  trLn.item, trLn.quantity AS QuantityLine, trLn.transaction, nvntr.quantity AS QuantityLot, nmbr.inventoryNumber AS  lot, TO_CHAR(nmbr.expirationdate , 'MM/DD/YYYY') AS ExpirationDate, nmbr.id AS LotId FROM transactionLine AS trLn INNER JOIN inventoryAssignment AS nvntr ON nvntr.transaction = trLn.transaction AND nvntr.transactionLine = trLn.id  INNER JOIN inventoryNumber AS nmbr ON nmbr.id =  nvntr.inventorynumber  WHERE trLn.transaction = ?"
  
  const SCRIPTS = {}

  SCRIPTS.EPCIS_RECORD_UE = {}
  SCRIPTS.EPCIS_RECORD_UE.SCRIPTID = 'customscript_st_epcis';
  SCRIPTS.EPCIS_RECORD_UE.DEPLOY_IF = 'customdeploy_st_epcis_if';
  SCRIPTS.EPCIS_RECORD_UE.DEPLOY_IR = 'customdeploy_st_epcis_ir';

    return { QUERIES, SCRIPTS}
  })
  