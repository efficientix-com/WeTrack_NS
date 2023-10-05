/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/ui/serverWidget', 'N/error'],

    (log, search, serverWidget, error) => {
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
                if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                    log.debug({
                        title: "Triggered by creation in beforeLoad",
                        details: true
                    });
                    var form = scriptContext.form;
                    var html_fld = form.addField({
                        id: "custpage_html",
                        label: "html",
                        type: serverWidget.FieldType.INLINEHTML,
                    });
                    html_fld.defaultValue = '<script>';
                    html_fld.defaultValue += 'console.log("User event is being triggered");';
                    html_fld.defaultValue += `var listener4Events=document.querySelectorAll('.uir-header-buttons [id^="custpage"]');`;
                    html_fld.defaultValue += "for(var i=0;i<listener4Events.length;i++){"

                    html_fld.defaultValue += 'listener4Events[i].addEventListener("click", ()=>{';

                    html_fld.defaultValue += 'var mascaraDialog=document.getElementsByTagName("body")[0];'
                    html_fld.defaultValue += 'function cargarEstiloDialog(mutations){'
                    html_fld.defaultValue += 'for(let mutationD of mutations){'
                    html_fld.defaultValue += 'if(mutationD.type==="childList"){'
                    html_fld.defaultValue += 'var addedNodeD= mutationD.addedNodes;'
                    html_fld.defaultValue += 'console.log("Detectado de cambios",addedNodeD);'
                    html_fld.defaultValue += 'for(var i=0;i<addedNodeD.length;i++){'

                    html_fld.defaultValue += 'var addedNodeClassNameD= addedNodeD[i].className;'
                    html_fld.defaultValue += 'console.log("ClassName",addedNodeClassNameD);'
                    html_fld.defaultValue += 'if(addedNodeClassNameD=="x-window x-layer x-window-default x-border-box x-focus x-window-focus x-window-default-focus"){'

                    html_fld.defaultValue += 'console.log("Dialog was triggered");'

                    // Código de renderización de dialog
                    html_fld.defaultValue += `var dialog=document.querySelector('[role="dialog"] .uir-message-header');`;
                    html_fld.defaultValue += "if(dialog){"
                    html_fld.defaultValue += `var dialogHeader=document.querySelector('[role="dialog"] .x-window-header-title-default');`;
                    html_fld.defaultValue += `var dialogAll=document.querySelector('[role="dialog"].x-window-default');`;
                    html_fld.defaultValue += `var dialogButton=document.querySelector('[role="dialog"] .uir-message-buttons button');`;
                    html_fld.defaultValue += 'dialog.classList.remove("x-window-header-default");';
                    html_fld.defaultValue += `dialog.style.backgroundColor='white';`;
                    html_fld.defaultValue += "dialog.style.borderTop='10px solid #0077be';"
                    html_fld.defaultValue += "dialog.style.borderRadius='3px';"

                    html_fld.defaultValue += `dialogHeader.style.color='#0077be';`;


                    html_fld.defaultValue += `dialogButton.style.backgroundColor='#0077be';`;
                    html_fld.defaultValue += `dialogButton.style.color='white';`;
                    html_fld.defaultValue += "dialogButton.style.border='2px solid #0077be';"

                    html_fld.defaultValue += "dialogAll.style.borderRadius='3px';"

                    html_fld.defaultValue += "}"
                    // Fin de código de renderización de dialog

                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += 'var observadorD=new MutationObserver(cargarEstiloDialog);'

                    html_fld.defaultValue += 'observadorD.observe(mascaraDialog,{childList: true});'
                    html_fld.defaultValue += '});';
                    html_fld.defaultValue += '}';

                    html_fld.defaultValue += '</script>';
                    var subsidiaries_have_config = getNumberOfSubsidiaries();
                    if (subsidiaries_have_config === true) {
                        log.debug({
                            title: "DETECTTED MORE THAN ONE SUB",
                            details: true
                        })
                        form.addButton({
                            id: "custpage_trigger_alert",
                            label: "Alert",
                            functionName: 'onASN_alert'
                        });
                        form.clientScriptModulePath = './TKIO - SuiteTrace SFTP manage buttons - CL.js';

                        html_fld.defaultValue += `<script>
                            document.getElementById('tbl_custpage_trigger_alert').style.setProperty('visibility','hidden','important');
                            document.getElementById('custpage_trigger_alert').click();
                            </script>`;

                    }

                }

            } catch (err) {
                log.error({ title: 'Error occurred in beforeSubmit', details: err });
            }
        }
        const getNumberOfSubsidiaries = () => {
            try {
                var subs_with_config = 0;
                var subs = 0;
                var value_to_return = false;
                const subsidiarySearchColIdInterno = search.createColumn({ name: 'internalid' });

                const subsidiarySearch = search.create({
                    type: 'subsidiary',
                    filters: [],
                    columns: [
                        subsidiarySearchColIdInterno,

                    ],
                });
                const subsidiarySearchPagedData = subsidiarySearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < subsidiarySearchPagedData.pageRanges.length; i++) {
                    const subsidiarySearchPage = subsidiarySearchPagedData.fetch({ index: i });
                    subs += subsidiarySearchPage.data.length;
                    subsidiarySearchPage.data.forEach((result) => {
                        const idInterno = result.getValue(subsidiarySearchColIdInterno);
                        if (ASNConfigWithSubsidiary(idInterno) > 0) {
                            subs_with_config++;
                        }
                       
                    });
                    if (subs_with_config === subs) {
                        value_to_return = true;
                    }
                    log.debug({
                        title: "subs_with_config",
                        details: subs_with_config
                    })
                    log.debug({
                        title: "subs",
                        details: subs
                    })

                }
                return value_to_return;
            } catch (err) {
                log.error({ title: 'Error occurred in getNumberOfSubsidiaries', details: err });
                return null;
            }
        }
       
        
        const ASNConfigWithSubsidiary = (id) => {
            try {
                var value_to_return = 0;
                const customrecord_suitetrace_asn_configuratioSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
                const customrecord_suitetrace_asn_configuratioSearch = search.create({
                    type: 'customrecord_suitetrace_asn_configuratio',
                    filters: [
                        ['custrecord_suitetrace_subsidiary', 'anyof', id],

                    ],
                    columns: [
                        customrecord_suitetrace_asn_configuratioSearchColId,
                    ],
                });

                const customrecord_suitetrace_asn_configuratioSearchPagedData = customrecord_suitetrace_asn_configuratioSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < customrecord_suitetrace_asn_configuratioSearchPagedData.pageRanges.length; i++) {
                    const customrecord_suitetrace_asn_configuratioSearchPage = customrecord_suitetrace_asn_configuratioSearchPagedData.fetch({ index: i });
                    log.debug({
                        title: "SUBS CONF",
                        details: customrecord_suitetrace_asn_configuratioSearchPage.data.length
                    })
                    if (customrecord_suitetrace_asn_configuratioSearchPage.data.length > 0) {
                        value_to_return = customrecord_suitetrace_asn_configuratioSearchPage.data.length
                    }
                }
                // if (customrecord_suitetrace_asn_configuratioSearchPagedData.pageRanges.length > 0) {
                //     value_to_return = true
                //     log
                // }
                return value_to_return;

            } catch (err) {
                log.error({ title: 'Error occurred in ASNConfigWithSubsidiary', details: err });
                return null;
            }
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

            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                var already_exists=ASNConfigWithSubsidiary(scriptContext.newRecord.getValue({fieldId:'custrecord_suitetrace_subsidiary'}))
                
                var subsidiaries_have_config = getNumberOfSubsidiaries();
                log.debug({
                    title: "subsidiaries_have_config",
                    details: subsidiaries_have_config
                })
                
                if (subsidiaries_have_config === true || already_exists>0) {
                    throw 'Cannot add more than one configuration per Subsidiary';
                }
            }
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

        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
