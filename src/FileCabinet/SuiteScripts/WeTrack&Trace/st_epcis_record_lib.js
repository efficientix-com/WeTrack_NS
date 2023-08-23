/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/query', './st_epcis_record_const'], (log, query, constQ) => {

    const QUERIES = constQ.QUERIES
    const SCRIPTS = constQ.SCRIPTS

    const searchLotData = tranId => {
        try{
            log.debug({title:'searchLotData tranId', details:tranId});
            var results = query.runSuiteQL({
                query: QUERIES.LOT_INFORMATION,
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
            for(var i in lots){
                log.debug("results", lots[i])
            }
            return lots;
        }
        catch(e){
          log.error({title:'searchLotData', details:e});
        }
      }
    
        return { searchLotData, createEPCISrecords }
  })
  