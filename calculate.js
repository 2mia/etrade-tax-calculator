(function () {
  var info = console.info;
  console.captured = ""
  console.info = function () {
    var args =  Array.prototype.slice.call(arguments);
    info.apply(this, args);
    console.captured += args.join(" ")+"\n";
  };
}());


var updateDates2 = function() {
    
    var scope = angular.element($('.ordersGrantTbl')).scope();
    var orderCount = scope.oh.openOrder.length;

    var settled = [];
    for (var i = 0; i < orderCount; i++) {
        if (scope.oh.openOrder[i].orderStatus !== "Settled") {
            continue;
        }

        var element = $('#orderTable-collapse' + i + " > div");
        var itemScope = angular.element(element).scope();

        var settledItem = Object.assign({}, itemScope.openOrder, scope.oh.openOrder[i]);
        settled.push(settledItem);
    }

    var totalProfits = 0;

    // for each row
    for (var i=0;i<settled.length; i++) {
        var order = settled[i]
        var lineComission = 0;
        var stockPrice = 0;

        // get the selling proce per share for the table
        var sellingPricePerShare = order.executedPrice

        var orderGrossRevenue = 0;
        var orderCost = 0;

        // calculate the line-level lineComission
        lineComission = order.disbursementDetails[0].commission+
                        order.disbursementDetails[0].disbursementFee+
                        order.disbursementDetails[0].brokerageAssistFee+
                        order.disbursementDetails[0].secFee;

        console.info("Order: ",order.soldQty,"*",order.executedPrice)

        // for all grants in this transaction
        for (var grant of order.purchaseGrantDetails) {

            var sharesCount = grant.sharesSellSold

            orderGrossRevenue += sellingPricePerShare * sharesCount;

            var RSU = (grant.type == "RSU")
            var date = grant.vestDate;
            if (!RSU){
                date = grant.purchaseDate;
            }
            var dateObj = new Date(date);

            var stockPrice = 0;

            if (RSU || (!RSU && (dateObj <= new Date('12/31/2011') || dateObj >= new Date('12/31/2013')))) {
                // if RSU or ESPP, but before 2012 or after 2013
                // use the market value
                

                do {
                    stockPrice = adobeStockValues[date] || 0;
                    if (stockPrice > 0) break;
                    console.debug("\t\t go back 1 day and get close price", date, stockPrice)
                    // go back 1 day nasdaq was closed  
                    var dateObj = new Date(dateObj.getTime()-24*60*60*1000);
                    date = dateObj.toLocaleString('en-us', {year: 'numeric', month: '2-digit', day: '2-digit'})
                } while(stockPrice == 0)
                
            } else {
                // if ESPP between and taxes were not paid on the diff
                // use the grant purchase value
                stockPrice = grant.purchasePrice;
            }

            var grantCost = stockPrice * sharesCount;
            orderCost += grantCost
            console.info("\t",RSU?"[RSU ]":"[ESPP]","grant cost: ",grantCost,"=",stockPrice,"*",sharesCount)
        }
        var orderProfit = orderGrossRevenue-orderCost-lineComission
        console.info("order profit: ",orderProfit," = ",orderGrossRevenue,"-",orderCost,"-",lineComission )
        totalProfits += orderProfit
    }

    totalProfits = parseInt(totalProfits*100)/100;
    console.info("total profit ", totalProfits)

}

var initRomaniaTaxes = function() {
    console.captured = "";
    updateDates2();
    var w = window.open();
    $(w.document.body).html("<pre>"+console.captured+"</pre>");
}


document.addEventListener('initRomaniaTaxes', function(e) {
    initRomaniaTaxes()
});

console.info(">>", angular);
