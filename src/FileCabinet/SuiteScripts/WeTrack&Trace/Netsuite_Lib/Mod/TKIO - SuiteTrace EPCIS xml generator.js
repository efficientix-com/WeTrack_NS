/**
 * @NApiVersion 2.1
 * @name TKIO - SuiteTrace EPCIS xml generator
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@tekiio.mx>
 * @summary Libreria para la creación de archivo EPCIS XML
 * @copyright Tekiio México 2023
 * 
 * Client              -> Tekiio
 * Last modification   -> 24/08/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 */
define(["../Enum/TKIO - Const Lib", "N/log", "N/error"],
    
/**
 * @param {constLib} constLib - Modulo a cargar para manejo de campos en Netsuite
 * @param {log} log - Modulo a cargar para el manejo mensajes
 * @param {newError} newError - Modulo a cargar para el manejo errores personalizados
 */
   
   function (constLib, log, newError) {

    const generateEpcis = (groupingRecord) =>{
        const response = {success: false, error: '', epcisFile: ''}
        try {
            const { RECORDS } = constLib;
            log.debug({ title:' groupingRecord', details:groupingRecord });
            log.debug({ title:'Records', details:RECORDS });
        } catch (error) {
            log.error({ title:'generateEpcis', details:error });
            response.success = false;
            response.error = error;
        }
        return response;
    }

   return {
       generateEpcis: generateEpcis
   }
   });