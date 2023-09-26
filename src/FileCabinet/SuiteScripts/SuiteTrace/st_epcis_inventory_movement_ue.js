/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @name ST - EPCIS INVENTORY MOVEMENT UE
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary This script will create the records for transactions movements
 * @copyright FreeBug 2023
 * 
 * Client              -> Product
 * Last modification   -> 20/08/2023
 * Modified by         -> Andrea Tapia <andrea.tapia@freebug.mx>
 * Script in NS        -> ST - EPCIS RECORD UE <customscript_st_epcis>
 */
define(['N/currentRecord', 'N/log', 'N/runtime', './st_epcis_record_const', './st_epcis_record_lib'],
    /**
 * @param{currentRecord} currentRecord
 * @param{log} log
 * @param{runtime} runtime
 */
    (currentRecord, log, runtime, constVal, lib) => {
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
            
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {
                
            } catch (error) {
                log.error({title:'afterSubmit', details:error});
            }
        }

        return {afterSubmit, beforeLoad}

    });
