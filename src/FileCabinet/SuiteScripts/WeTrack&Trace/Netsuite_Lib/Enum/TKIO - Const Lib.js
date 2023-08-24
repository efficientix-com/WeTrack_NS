/**
 * @NApiVersion 2.1
 */
define([], () => {
    const RECORDS = {}

    RECORDS.NAME = 'Nombre'
    RECORDS.CONFIG = {}
    RECORDS.CONFIG.ID = 'customrecord_id'
    RECORDS.CONFIG.FIELDS = {}
    RECORDS.CONFIG.FIELDS.CLIENTE = 'Cliente'
    RECORDS.CONFIG.FIELDS.DATE = 'Date'

    return { RECORDS }
  })
  