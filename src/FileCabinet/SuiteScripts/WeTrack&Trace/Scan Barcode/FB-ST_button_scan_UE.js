/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @name FB-ST_button_scan_UE
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary Script para mostrar el boton en las transacciones y poder escanear articulos.
 * @copyright Tekiio México 2023
 * 
 * Client              -> Tekiio
 * Last modification   -> 07/09/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - ST_Button_Scan_PO_UE <ID del registro>
 */
define(['N/log'],
    /**
 * @param{http} http
 * @param{https} https
 * @param{log} log
 * @param{runtime} runtime
 * @param{search} search
 * @param{url} url
 */
    (log) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                    // var scriptObj = runtime.getCurrentScript();
                    var objRecord = scriptContext.newRecord;
                    var typeTransaction = objRecord.type;
                    var form = scriptContext.form;
                    var status = objRecord.getValue({fieldId: 'orderstatus'});
                    var createdFrom = objRecord.getValue({fieldId: 'createdfrom'});
                    if ( !createdFrom && (status == 'B' || status == 'E')) { // No es dropship - Pendiente de recibir - Parcialmente recivido
                        log.debug({ title:'statusref', details:status });
                        log.audit('type transaction', typeTransaction);
                        log.debug({ title:'idTransaction', details:objRecord.id });
                        form.addButton({
                            id: 'custpage_fb_st_btn_scan_po',
                            label: 'Scan and Receive',
                            functionName: 'sendToScan("' + typeTransaction + '",'+ objRecord.id +')'
                        });
                        form.clientScriptModulePath = './FB-ST_button_scan_CS.js';
                    }
                }
            } catch (e) {
                log.error('Error on before load', e);
            }
        }

        return {beforeLoad}

    });
