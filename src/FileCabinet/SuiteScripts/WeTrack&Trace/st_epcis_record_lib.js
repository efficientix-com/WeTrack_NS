/**
 * @NApiVersion 2.1   
 */
define(['N/log', 'N/query', 'N/record', 'N/search', './st_epcis_record_const'], (log, query, record, search, constQ) => {

  const QUERIES = constQ.QUERIES
  const SCRIPTS = constQ.SCRIPTS
  const THTITSIM = constQ.THTITSIM
  const THTITS_QUERY_DATA = constQ.THTITS_QUERY_DATA

  const searchLotData = tranId => {
      try{
          log.debug({title:'searchLotData tranId', details:tranId});
          var results = query.runSuiteQL({
              query: QUERIES.LOT_INFORMATION_PO_IR,
              params: [tranId],
              customScriptId: SCRIPTS.EPCIS_RECORD_UE.SCRIPTID
          }).asMappedResults();
          log.debug({title:'searchLotData results', details:results});
          return results;
      }
      catch(e){
        log.error({title:'searchLotData', details:e});
      }
    }

    const createEPCISrecords = lots => {
      try{
          //GET Inventory data 
          var filtersObject =[];

          for(var i in lots){
            var lotfilter = [
              [THTITSIM.INVENTORY_DETAIL,search.Operator.IS,lots[i][THTITS_QUERY_DATA.INVENTORY_DETAIL]],
              'AND',
              [THTITSIM.SOURCE_TRANSACTION,search.Operator.IS,lots[i][THTITS_QUERY_DATA.SOURCE_TRANSACTION]]
            ];

            if(filtersObject.length){
              filtersObject.push("OR");
            }

            filtersObject.push(lotfilter);
            
          }
          log.debug("filtersObject", filtersObject)

          var lotsexisting = existsTHTITSList(filtersObject)

          for(var l in lots){
              //log.debug("results", lots[i])
              let queryKeys = Object.keys(THTITS_QUERY_DATA);

              var concat = "";
              concat += lots[l][THTITS_QUERY_DATA.INVENTORY_DETAIL]
              concat += lots[l][THTITS_QUERY_DATA.SOURCE_TRANSACTION]

              log.debug("concat: " + concat  , lotsexisting[concat]);
              

              let recorid = lotsexisting[concat] ? lotsexisting[concat]: null//existTHTITS(lots[l][THTITS_QUERY_DATA.INVENTORY_DETAIL], lots[l][THTITS_QUERY_DATA.SOURCE_TRANSACTION])
              let thtisRecord = null;

              if(recorid){
                thtisRecord = record.load({
                  type: THTITSIM.TYPE,
                  id: recorid,
                  isDynamic: true,
                }); 
              }
              else{
                thtisRecord = record.create({
                  type: THTITSIM.TYPE,
                  isDynamic: true,
                }); 
              }
              

              for(let j in queryKeys){
                var key = queryKeys[j]
                //log.debug("KEY: " + key,  "FIELDID: " + THTITSIM[key] + " VALUE: " +  lots[i][THTITS_QUERY_DATA[key]])
                thtisRecord.setValue({
                    fieldId: THTITSIM[key],
                    value: lots[l][THTITS_QUERY_DATA[key]] || '',
                    ignoreFieldChange: true
                });
                
              }

              thtisRecord.setValue({
                  fieldId: THTITSIM.IS_INTERNAL_MOVEMENTS,
                  value: true,
                  ignoreFieldChange: true
              });

            var recordId = thtisRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug("createEPCISrecords", recordId)

          }
          return lots;
      }
      catch(e){
        log.error({title:'createEPCISrecords', details:e});
      }
    }

    const existsTHTITSList = filters => {
      var resultsTHTITS = {};
      try{
          
          let searchStructure = search.create({
            type: THTITSIM.TYPE,
            filters: filters,
            columns:
            [
              search.createColumn({name: THTITSIM.INVENTORY_DETAIL}),
              search.createColumn({name: THTITSIM.SOURCE_TRANSACTION}),
              search.createColumn({name: 'custrecord_wetrack_gtin'}),
              
            ]
        });

        searchStructure.run().each(function(result){
          // .run().each has a limit of 4,000 results
          var concat = "";
          concat += result.getValue({name: THTITSIM.INVENTORY_DETAIL});
          concat += result.getValue({name: THTITSIM.SOURCE_TRANSACTION});

          log.debug("result", result)
          log.debug("concat", concat)
          
          resultsTHTITS[concat] = result.id;
          return true;
        });

          
      }
      catch(e){
        log.error({title:'existsTHTITSList', details:e});
      }

      log.debug("resultsTHTITS", resultsTHTITS)
      return resultsTHTITS;
    }

    const existTHTITS = (inventoryDetailId, itemReceiptId) => {
      let idRecord = null;
      try{
          log.debug({title:'existTHTITS data', details:"Inventory Detail: " + inventoryDetailId + " Item Receipt: " + itemReceiptId});
          let searchStructure = search.create({
            type: THTITSIM.TYPE,
            filters:
            [
               [THTITSIM.INVENTORY_DETAIL,search.Operator.IS,inventoryDetailId],
               'AND',
               [THTITSIM.SOURCE_TRANSACTION,search.Operator.IS,itemReceiptId],
            ],
            columns:
            [
               search.createColumn({name: "internalid"}),
            ]
         });

         let results = searchStructure.run().getRange(0, 10)

         if(results.length){
          idRecord = results[0].id;
         }
          
      }
      catch(e){
        log.error({title:'existTHTITS', details:e});
      }

      log.debug({title:'existTHTITS idRecord', details:idRecord});
      return idRecord;
    }
  
      return { searchLotData, createEPCISrecords, existTHTITS }
})
