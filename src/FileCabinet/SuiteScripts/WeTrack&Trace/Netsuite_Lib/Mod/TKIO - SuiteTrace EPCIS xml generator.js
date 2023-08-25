/**
 * @NApiVersion 2.1
 * @name TKIO - SuiteTrace EPCIS xml generator
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@tekiio.mx>
 * @summary Libreria para la creación de archivo EPCIS XML
 * @copyright Tekiio México 2023
 * 
 * Client              -> Tekiio
 * Last modification   -> 25/08/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 */
define(["../Enum/TKIO - Const Lib", "N/log", "N/error", "N/xml", "N/file", "N/search"],

    /**
     * @param {constLib} constLib - Modulo a cargar para manejo de campos en Netsuite
     * @param {log} log - Modulo a cargar para el manejo de mensajes
     * @param {newError} newError - Modulo a cargar para el manejo de errores personalizados
     * @param {xml} xml - Modulo a cargar para el manejo de xml
     * @param {file} file - Modulo a cargar para el manejo de archivos
     * @param {search} search - Modulo a cargar para el manejo de busqueda de informacion
     */
   
    function (constLib, log, newError, xml, file, search) {

        /**
         * The function `generateEpcis` generates and saves an EPCIS file in a specified folder.
         * @param folderEpcis - The `folderEpcis` parameter is the folder where the EPCIS file will be
         * saved.
         * @returns The function `generateEpcis` returns an object with the following properties:
         */
        const generateEpcis = (folderEpcis) =>{
            const response = {success: false, error: '', epcisFile: ''}
            try {
                const { RECORDS } = constLib;
                log.debug({ title:'Records', details:RECORDS });
                { // Seccion validate folder
                    if (!folderEpcis) {
                        throw generateError('FOLDER NOT CONFIGURED', 'The folder for saving documents has not been received. Check your parameters.', 'A folder has not been sent to the library.');
                    }
                    let validateFolderResult = validateFolder(folderEpcis);
                    if (validateFolderResult.success == false) {
                        throw validateFolderResult.error;
                    }
                }
                { // seccion build & save epcis file
                    var xmlString = '<epcis:EPCISDocument xmlns:epcis = "urn:epcglobal:epcis:xsd:1"></epcis:EPCISDocument>'
                    // let xmlString = '<?xml version="1.0" encoding="UTF-8"?><config date="1465467658668" transient="false">Some content</config>';
                    const epcisFile = file.create({
                        name: 'PruebaDatos.xml',
                        contents: xmlString,
                        fileType: file.Type.PLAINTEXT,
                        folder: folderEpcis
                    });
                    let saveEpcis = epcisFile.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    if (saveEpcis) {
                        response.epcisFile = saveEpcis;
                    }
                }
            } catch (error) {
                log.error({ title:'generateEpcis', details:error });
                response.success = false;
                response.error = error;
            }
            return response;
        }

        const validateFolder = (folderId) =>{
            const response = {success: false, error: ''};
            try {
                var folderSearchObj = search.create({
                    type: search.Type.FOLDER,
                    filters:
                    [
                       ["internalid","anyof",folderId]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "internalid",
                          sort: search.Sort.ASC,
                          label: "Internal ID"
                       }),
                       search.createColumn({name: "name", label: "Name"}),
                       search.createColumn({name: "foldersize", label: "Size (KB)"}),
                       search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
                       search.createColumn({name: "parent", label: "Sub of"}),
                       search.createColumn({name: "numfiles", label: "# of Files"})
                    ]
                });
                var folderCount = folderSearchObj.runPaged().count;
                if (folderCount>0) { // Exist folder
                    response.success = true;
                }else{// Not folder
                    response.error = generateError('FOLDER NOT FOUND', 'The folder you have provided does not exist in Netsuite.', 'When searching for the folder in netsuite, the folder id was not found.');
                }
            } catch (error) {
                log.error({ title:'validateFolder', details:error });
                response.error = error;
            }
            return response
        }

        /**
         * The function `generateError` creates a custom error object with a given code and message.
         * @param code - The code parameter is a string that represents the error code or name. It can
         * be any string value that you want to use to identify the error.
         * @param msg - The `msg` parameter is a string that represents the error message you want to
         * associate with the custom error. It can be any descriptive text that helps identify the
         * cause or nature of the error.
         * @returns The function `generateError` returns a custom error object with the specified code
         * and message.
         */
        const generateError = (code, msg, cause) =>{
            try {
                var custom_error = newError.create({
                    name: code,
                    message: 'EPCIS generator: ' + msg,
                    cause: cause
                });
                return custom_error;
            } catch (error) {
                log.error({ title:'generateError', details:error });
            }
        }
    
        return {
            generateEpcis: generateEpcis
        }
    }
);