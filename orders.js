(function(){
    
    let handler = async function(event){
        const currentEvent = JSON.parse(JSON.stringify(event));
        let recordId = parseInt(currentEvent.record.item_rn.value);
        /* When status is being updated we need to check incoming status, when only record is updated we need to check current status */
        let orderStatus = currentEvent.nextStatus.value;     
        let orderType = currentEvent.record.order_type.value;
        let orderQty = parseInt(currentEvent.record.qty.value);
        
        let itemRecord;
        let stockTotal;
        let newStockTotal;
        switch(checkOrderStatusType(orderStatus,orderType)){
            case 'add':
                itemRecord = await getRecord(recordId);
                stockTotal = parseInt(itemRecord.record.stock.value);
                newStockTotal = addToInventory(stockTotal, orderQty);
                updateQty(recordId, newStockTotal);
                break;
            case 'remove':
                itemRecord = await getRecord(recordId);
                stockTotal = parseInt(itemRecord.record.stock.value);
                newStockTotal = removeFromInventory(stockTotal, orderQty);
                updateQty(recordId, newStockTotal);
                break;
            default:
                break;
        }
        

        return event;
    }

    /* Web and mobile event for updating record status */
    kintone.events.on('app.record.detail.process.proceed', handler);

    /* Expected action for Ready for Sale, Refunded, or Shipped */
    /* Expected action for Purchased and Sale depending on Order Status */
    function checkOrderStatusType(orderStatus, orderType){
        if((orderStatus === 'Ready for Sale' && orderType === 'Purchase') || (orderStatus === 'Product Returned' && orderType === 'Sale')) {
            /* We are getting new items or receiving old items back, increase inventory count*/
            return 'add';
        } else if(orderStatus === 'Shipped' && orderType === 'Sale') {
            /* We are selling our stock, decrease inventory count */
            return 'remove';
        } else {
            return false;
        }
    }

    /* TO DO: Obtain record id from event */
    function getRecord(recordId) {
        return kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
            'app': 7,
            'id': recordId
        }).then(function(response){
            console.log('Record found.');
            return response;
        }).catch(function(error){
            console.log('Error retrieving record.');
            console.log(error);
            return error;
        });
    }

    /* Add to iventory when items are returned or purchased from vendor */
    function addToInventory(totalQty, items){
        let newQty = totalQty + items;
        return newQty;
    }

    /* Remove from iventory when items are purchased*/
    function removeFromInventory(totalQty, items){
        let newQty = totalQty - items;
        return newQty;
    }
    
    function updateQty(recordId, newQty) {
        kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
            'app': 7,
            'id': recordId,
            'record': {
                'stock': {
                    'value': newQty
                }
            }
        }).then(function(response){
            console.log('Record updated.');
            return response;
        }).catch(function(error){
            console.log('Error updating record.');
            console.log(error);
            return error;
        });
    }

})();