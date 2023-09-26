/**
 * @NApiVersion 2.1
 */
define([], () => {
  
  const QUERIES = {};
  QUERIES.LOT_INFORMATION_PO_IR = "SELECT nts.conversionrate AS container, trn.custbody_tkio_suitetrace_related_epcis AS related_epcis, TO_CHAR(trn.trandate , 'MM/DD/YYYY') AS ship_date, tm.custitem_tkio_gtin_hlx AS gtin, tm.custitem_st_stregnth AS stregnth, lct.name AS lot_location, tm.id AS item_id, nvntr.id AS inventory_detail_id, crtdtrn.id AS createdfrom_id, trLn.quantity AS quantity_line, trLn.transaction, nvntr.quantity AS quantity_lot, nmbr.inventoryNumber AS  lot, TO_CHAR(nmbr.expirationdate , 'MM/DD/YYYY') AS expiration_date, nmbr.id AS lot_id, tm.displayName AS Product, nttCust.altname, crtdtrn.recordtype AS createdfrom, nts.unitname, nts.pluralname, mnfct.name AS manufacturer, bllddrss.custrecord_tkio_gln_address AS sender_gln, bllddrss.addressee AS sender_name, bllddrss.addr1 AS sender_addr1, bllddrss.addr2 AS sender_addr2, bllddrss.city AS sender_city, bllddrss.state AS sender_state, bllddrss.country AS sender_country, bllddrss.zip AS sender_zip, bllddrss.custrecord_tkio_gln_address AS sender_location_gln, bllddrss.addressee AS sender_location_name, bllddrss.addr1 AS sender_location_addr1, bllddrss.addr2 AS sender_location_addr2, bllddrss.city AS sender_location_city, bllddrss.state AS sender_location_state, bllddrss.country AS sender_location_country, bllddrss.zip AS sender_location_zip, sbsdddr.custrecord_tkio_gln_address AS reciever_gln, sbsdddr.addressee AS reciever_name, sbsdddr.addr1 AS reciever_addr1, sbsdddr.addr2 AS reciever_addr2, sbsdddr.city AS reciever_city, sbsdddr.state AS reciever_state, sbsdddr.country AS reciever_country, sbsdddr.zip AS reciever_zip, lctmn.custrecord_tkio_gln_address AS reciever_location_gln, lctmn.addressee AS reciever_location_name, lctmn.addr1 AS reciever_location_addr1, lctmn.addr2 AS reciever_location_addr2, lctmn.city AS reciever_location_city, lctmn.state AS reciever_location_state, lctmn.country AS reciever_location_country, lctmn.zip AS reciever_location_zip FROM transactionLine AS trLn INNER JOIN 	transaction AS trn ON trn.id =  trLn.transaction INNER JOIN 	transaction AS crtdtrn ON crtdtrn.id =  trLn.createdfrom INNER JOIN unitsTypeUom AS nts ON nts.internalid = trLn.units INNER JOIN entity AS nttCust ON nttCust.id =  trn.entity INNER JOIN location AS lct ON lct.id = trLn.location LEFT JOIN LocationMainAddress AS lctmn ON lctmn.nkey = lct.mainAddress INNER JOIN inventoryAssignment AS nvntr ON nvntr.transaction = trLn.transaction AND nvntr.transactionLine = trLn.id INNER JOIN inventoryNumber AS nmbr ON nmbr.id =  nvntr.inventorynumber INNER JOIN item AS tm ON tm.id = trLn.item LEFT JOIN customlist_tkio_manufacturer_list_hl AS mnfct ON mnfct.id = tm.custitem_tkio_hl_manufaturer_it LEFT JOIN transactionBillingAddress AS bllddrss ON bllddrss.nkey = crtdtrn.billingAddress LEFT JOIN subsidiary AS sbdr ON sbdr.id = trLn.subsidiary LEFT JOIN SubsidiaryMainAddress AS sbsdddr ON sbsdddr.nkey = sbdr.mainAddress WHERE trLn.transaction = ?"
  
  const SCRIPTS = {}

  SCRIPTS.EPCIS_RECORD_UE = {}
  SCRIPTS.EPCIS_RECORD_UE.SCRIPTID = 'customscript_st_epcis';
  SCRIPTS.EPCIS_RECORD_UE.DEPLOY_IF = 'customdeploy_st_epcis_if';
  SCRIPTS.EPCIS_RECORD_UE.DEPLOY_IR = 'customdeploy_st_epcis_ir';


  const THTITSIM = {}
  THTITSIM.TYPE = 'customrecord_tkio_wetrack_epcis_transact'
  THTITSIM.IS_TH = 'custrecord_tkio_is_th_file';
  THTITSIM.IS_INTERNAL_MOVEMENTS = 'custrecord_tkio_internal_movement'
  THTITSIM.IS_QUARENTINE = 'custrecord_tkio_is_in_quarantine'
  THTITSIM.IS_SUSPICIOUS = 'custrecord_tkio_lot_is_suspicious'
  THTITSIM.LOT_LOCATION = 'custrecord_tkio_lot_location'
  THTITSIM.RECEIVER_LOCATION_SGLN = 'custrecord_tkio_receiver_loc_sgln'
  THTITSIM.RECEIVER_SGLN = 'custrecord_tkio_receiver_sgln'
  THTITSIM.STRENGTH = 'custrecord_tkio_suitetrace_strength'
  THTITSIM.SGTIN = 'custrecord_tkio_sgtin'
  THTITSIM.SHIP_DATE = 'custrecord_tkio_shipment_date'
  THTITSIM.CONTAINER_SZ = 'custrecord_tkio_suitetrace_container_sz'
  THTITSIM.DOSAGE = 'custrecord_tkio_suitetrace_dosage'
  THTITSIM.FILE = 'custrecord_tkio_suitetrace_epcis_file'
  THTITSIM.EXPIRATION_DATE = 'custrecord_tkio_suitetrace_expiry_date'
  THTITSIM.GROUPING = 'custrecord_tkio_suitetrace_grouping'
  THTITSIM.ITEM_NAME = 'custrecord_tkio_suitetrace_item_name'
  THTITSIM.MANUFACTURER = 'custrecord_tkio_suitetrace_mt_name'
  THTITSIM.RECEIVER_NAME = 'custrecord_tkio_suitetrace_rec_name'
  THTITSIM.RECEIVER_STATE = 'custrecord_tkio_suitetrace_rec_state'
  THTITSIM.RECEIVER_ADDR1 = 'custrecord_tkio_suitetrace_rec_addr1'
  THTITSIM.RECEIVER_ADDR2 = 'custrecord_tkio_suitetrace_rec_addr2'
  THTITSIM.RECEIVER_CONUNTRY = 'custrecord_tkio_suitetrace_rec_cc'
  THTITSIM.RECEIVER_CITY = 'custrecord_tkio_suitetrace_rec_city'
  THTITSIM.RECEIVER_ZIP = 'TBD'
  THTITSIM.RECEIVER_LOCATION_ADDR1 = 'custrecord_tkio_suitetrace_rec_loc_addr1'
  THTITSIM.RECEIVER_LOCATION_ADDR2 = 'custrecord_tkio_suitetrace_rec_loc_addr2'
  THTITSIM.RECEIVER_LOCATION_COUNTRY = 'custrecord_tkio_suitetrace_rec_loc_cc'
  THTITSIM.RECEIVER_LOCATION_CITY = 'custrecord_tkio_suitetrace_rec_loc_city'
  THTITSIM.RECEIVER_LOCATION_NAME = 'custrecord_tkio_suitetrace_rec_loc_name'
  THTITSIM.RECEIVER_LOCATION_ZIP = 'custrecord_tkio_suitetrace_rec_loc_pc'
  THTITSIM.RECEIVER_LOCATION_STATE = 'custrecord_tkio_suitetrace_rec_loc_state'
  THTITSIM.SENDER_NAME = 'custrecord_tkio_suitetrace_sender_name'
  THTITSIM.SENDER_SGLN = 'custrecord_tkio_wetrack_sgln'
  THTITSIM.SENDER_STATE = 'custrecord_tkio_suitetrace_sender_state'
  THTITSIM.SENDER_ADDR1 = 'custrecord_tkio_suitetrace_sen_loc_addr1'
  THTITSIM.SENDER_ADDR2 = 'custrecord_tkio_suitetrace_sen_loc_addr2'
  THTITSIM.SENDER_CONUNTRY = 'custrecord_tko_suitetrace_sender_cc'
  THTITSIM.SENDER_CITY = 'custrecord_tkio_suitetrace_sender_city'
  THTITSIM.SENDER_ZIP = 'custrecord_tkio_suitetrace_sender_pc'
  THTITSIM.SENDER_LOCATION_NAME = 'custrecord_tkio_suitetrace_sen_loc_name'
  THTITSIM.SENDER_LOCATION_GLN = 'custrecord_tkio_sender_loc_sgln'
  THTITSIM.SENDER_LOCATION_STATE = 'custrecord_tkio_suitetrace_sen_loc_state'
  THTITSIM.SENDER_LOCATION_ADDR1 = 'custrecord_tkio_suitetrace_sender_addr1'
  THTITSIM.SENDER_LOCATION_ADDR2 = 'custrecord_tkio_suitetrace_sender_addr2'
  THTITSIM.SENDER_LOCATION_CONUNTRY = 'custrecord_tkio_suitetrace_sen_loc_cc'
  THTITSIM.SENDER_LOCATION_CITY = 'custrecord_tkio_suitetrace_sen_loc_city'
  THTITSIM.SENDER_LOCATION_ZIP = 'custrecord_tkio_suitetrace_sen_loc_pc'
  THTITSIM.TRANSACTION_STATEMENT = 'custrecord_tkio_suitetrace_ts'
  THTITSIM.SUITETRACE_LEVEL_1 = 'custrecord_tkio_wetrack_level_1'
  THTITSIM.SUITETRACE_LEVEL_2 = 'custrecord_tkio_wetrack_level_2'
  THTITSIM.SUITETRACE_LEVEL_3 = 'custrecord_tkio_wetrack_level_3'
  THTITSIM.LOT = 'custrecord_tkio_wetrack_lot_number'
  THTITSIM.SOURCE_TRANSACTION = 'custrecord_st_source_transaction'
  THTITSIM.TRANSACTION = 'custrecord_tkio_transaction_list'
  THTITSIM.INVENTORY_DETAIL = 'custrecord_st_inventory_detail'
  THTITSIM.ITEM = 'custrecord_wetrack_gtin'
  

  const THTITS_QUERY_DATA = {};

  THTITS_QUERY_DATA.LOT_LOCATION = 'lot_location'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_SGLN = 'reciever_location_gln'
  THTITS_QUERY_DATA.RECEIVER_SGLN = 'reciever_gln'
  THTITS_QUERY_DATA.STRENGTH = 'stregnth'
  THTITS_QUERY_DATA.SGTIN = 'gtin'
  THTITS_QUERY_DATA.SHIP_DATE = 'ship_date'
  THTITS_QUERY_DATA.CONTAINER_SZ = 'container'
  THTITS_QUERY_DATA.DOSAGE = 'unitname'
  THTITS_QUERY_DATA.EXPIRATION_DATE = 'expiration_date'
  THTITS_QUERY_DATA.GROUPING = 'related_epcis'
  THTITS_QUERY_DATA.ITEM_NAME = 'product'
  THTITS_QUERY_DATA.MANUFACTURER = 'manufacturer'
  THTITS_QUERY_DATA.RECEIVER_NAME = 'reciever_name'
  THTITS_QUERY_DATA.RECEIVER_STATE = 'reciever_state'
  THTITS_QUERY_DATA.RECEIVER_ADDR1 = 'reciever_addr1'
  THTITS_QUERY_DATA.RECEIVER_ADDR2 = 'reciever_addr2'
  THTITS_QUERY_DATA.RECEIVER_CONUNTRY = 'reciever_country'
  THTITS_QUERY_DATA.RECEIVER_CITY = 'reciever_city'
  THTITS_QUERY_DATA.RECEIVER_ZIP = 'reciever_zip'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_ADDR1 = 'reciever_location_addr1'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_ADDR2 = 'reciever_location_addr2'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_COUNTRY = 'reciever_location_country'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_CITY = 'reciever_location_city'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_NAME = 'reciever_location_name'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_ZIP = 'reciever_location_zip'
  THTITS_QUERY_DATA.RECEIVER_LOCATION_STATE = 'reciever_location_state'
  THTITS_QUERY_DATA.SENDER_NAME = 'sender_name'
  THTITS_QUERY_DATA.SENDER_SGLN = 'sender_gln'
  THTITS_QUERY_DATA.SENDER_STATE = 'sender_state'
  THTITS_QUERY_DATA.SENDER_ADDR1 = 'sender_addr1'
  THTITS_QUERY_DATA.SENDER_ADDR2 = 'sender_addr2'
  THTITS_QUERY_DATA.SENDER_CONUNTRY = 'sender_country'
  THTITS_QUERY_DATA.SENDER_CITY = 'sender_city'
  THTITS_QUERY_DATA.SENDER_ZIP = 'sender_zip'
  THTITS_QUERY_DATA.SENDER_LOCATION_NAME = 'sender_location_name'
  THTITS_QUERY_DATA.SENDER_LOCATION_GLN = 'sender_location_gln'
  THTITS_QUERY_DATA.SENDER_LOCATION_STATE = 'sender_location_state'
  THTITS_QUERY_DATA.SENDER_LOCATION_ADDR1 = 'sender_location_addr1'
  THTITS_QUERY_DATA.SENDER_LOCATION_ADDR2 = 'sender_location_addr2'
  THTITS_QUERY_DATA.SENDER_LOCATION_CONUNTRY = 'sender_location_country'
  THTITS_QUERY_DATA.SENDER_LOCATION_CITY = 'sender_location_city'
  THTITS_QUERY_DATA.SENDER_LOCATION_ZIP = 'sender_location_zip'
  THTITS_QUERY_DATA.SUITETRACE_LEVEL_1 = '-'
  THTITS_QUERY_DATA.SUITETRACE_LEVEL_2 = '-'
  THTITS_QUERY_DATA.SUITETRACE_LEVEL_3 = '-'
  THTITS_QUERY_DATA.LOT = 'lot'
  THTITS_QUERY_DATA.SOURCE_TRANSACTION = 'transaction'
  THTITS_QUERY_DATA.TRANSACTION = 'createdfrom_id'
  THTITS_QUERY_DATA.INVENTORY_DETAIL = 'inventory_detail_id'
  THTITS_QUERY_DATA.ITEM = 'item_id'


    return { QUERIES, SCRIPTS, THTITSIM, THTITS_QUERY_DATA}
  })
  