const axios = require('axios')
axios.defaults.withCredentials = true
var COOKIES = []
var CSRFTOKEN = "fetch"

exports.lambdaHandler = async (event, context) => {
    
    console.log("Time to process the BYD Objects, folks!!")
    console.log(event)
    try {
        //Just for testing
        console.log("Parsing SNS Message")
        const stripeObject = JSON.parse(event.Records[0].Sns.Message)
        console.log(stripeObject)

        const sapOrder = stripeObject.metadata.id
        // const sapOrder = '4781'

        console.log(`Start processing of SAP Order ${sapOrder}`)

        await queryDeliveryRequest(sapOrder)
            .then(queryDeliveryProposal)
            .then(postGoodsIssue)              
            .then(releaseOutboundDelivery)
            // .then(getCustomerInvoiceRequest)
            // .then(releaseCustomerInvoiceRequest)
            .then(() => {
                console.log("All done!!")
            });
    } catch (err) {
        console.error(err);
    }
};

let queryDeliveryRequest = function (orderID) {
    // Return Deliveries for order
    return new Promise(function (resolve, reject) {
        console.log(`Query delivery Request for order ${orderID}`)
        
        let params = new URLSearchParams({
         //   "$format": "json",
            "SalesOrderID": quotes(orderID)})

        getBydObject(process.env.BYD_DELIVERYREQUEST+"/QueryByElements", params).then((response) => {
            console.log("Delivery Proposal Received")
            // console.log(data.d.resulength + "Delivery Proposal Retrieved!")
            resolve(response[0].ObjectID)
        })

    })
}

let queryDeliveryProposal = function (objectID) {
    // Return Deliveries for order
    return new Promise(function (resolve, reject) {
        console.log(`Query delivery proposal for Object ${objectID}`)
        
        let params = new URLSearchParams({
            "$format": "json",
            "$expand": "Item"})

        getBydObject(process.env.BYD_DELIVERYREQUEST+`/OutboundDeliveryRequestCollection(${quotes(objectID)})`, 
                                                    params).then((response) => {
            console.log("Delivery Proposal Received")
            // console.log(data.d.resulength + "Delivery Proposal Retrieved!")
            resolve(response)
        })

    })
}


let postGoodsIssue = function (deliveryProposalRespose) {
    // Returns Customers from BYD
    return new Promise(function (resolve, reject) {
        const delivery = deliveryProposalRespose.Item[0].ObjectID
        const bizTransaction = deliveryProposalRespose.BaseBusinessTransactionDocumentID
        
        console.log(`Posting Goods Issue for ${delivery}`)
        let params = new URLSearchParams({
         //   "$format": "json",
            "ObjectID": quotes(delivery)
        })
        console.log(`DARNM TOKEN IS!! ${CSRFTOKEN}`)
        getBydObject(process.env.BYD_DELIVERYREQUEST+"/ItemPostGoodsIssue", params, "POST")
        .then(() => {
            console.log("Goods issue posted!")
            queryOutboundDelivery(bizTransaction).then((data) => {
                resolve(data)
            })
            
        })
    })
}

let queryOutboundDelivery = function (odRequestID) {
    // Return Deliveries for order
    return new Promise(function (resolve, reject) {
        console.log(`Query outbound delivery for OD Request ${odRequestID}`)
        
        let params = new URLSearchParams({
            "$format": "json",
            "OutboundDeliveryRequestID": quotes(odRequestID)
        })

        getBydObject(process.env.BYD_OUTBOUNDDELIVERY+"/QueryByElements", params).then((data) => {
            console.log(data.length + " Query outbound delivery Retrieved!")
            resolve(data[0].ObjectID)
        })

    })
}

let releaseOutboundDelivery = function (outboundDelivery) {
    return new Promise(function (resolve, reject) {

        console.log(`Release Outbound Delivery for Object ${outboundDelivery}`)
        let params = new URLSearchParams({
            "$format": "json",
            "ObjectID": quotes(outboundDelivery)})

        getBydObject(process.env.BYD_OUTBOUNDDELIVERY+"/Release", params, "POST")
        .then((response) => {
            console.log("Outbound Delivery Released!")
                resolve(response.ID)
        })
    })
}

let getCustomerInvoiceRequest = function (ID) {
    // Return Deliveries for order
    return new Promise(function (resolve, reject) {
        console.log(`Query CustomerInvoiceRequest ${ID}`)
        
        let params = new URLSearchParams({
            "$format": "json",
            "$filter": `BaseBusinessTransactionDocumentID eq ${quotes(ID)} `
                       +`and BaseBusinessTransactionDocumentTypeCode eq ${quotes(73)}`})

        getBydObject(process.env.BYD_CUSTINVREQUEST+"/CustomerInvoiceRequestCollection", 
                                                params).then((response) => {
            console.log("Customer Invoice request! Received")
            // console.log(data.d.resulength + "Delivery Proposal Retrieved!")
            resolve(response[0].ObjectID)
        })

    })
}

let releaseCustomerInvoiceRequest = function (invoiceRequest) {
    return new Promise(function (resolve, reject) {

        console.log(`Release CustomerInvoiceRequest for Object ${invoiceRequest}`)
        let params = new URLSearchParams({
            "AutomaticReleaseAllowedIndicator": true,
            "ObjectID": quotes(invoiceRequest)})

        getBydObject(process.env.BYD_CUSTINVREQUEST+"/CreateCustomerInvoices", params, "POST")
        .then((response) => {
            console.log("Outbound Delivery Released!")
                resolve(response.ID)
        })
    })
}





let getBydObject = function (endpoint, params, method = "GET") {
    return new Promise(function (resolve, reject) {

        console.log("Preparing request to " + endpoint)
        

        const options = {
            method: method,
            baseURL: process.env.BYD_ODATA,
            url: endpoint,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic " + process.env.BYD_AUTH,
                "x-csrf-token": CSRFTOKEN,
                "Cookie": COOKIES
            },
            params: params
        }
        console.log("options")
        console.log(options)

        axios.request(options).then((response) => {
                console.log(`ByD Response: is ${response.status} - ${response.statusText}`)
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    console.error(response)
                    return reject(response);
                } else {
                    
                    if(response.headers['x-csrf-token']){
                        console.log(`Setting DARN TOKEN TO ${response.headers['x-csrf-token']}`)
                        CSRFTOKEN = response.headers['x-csrf-token']   
                    }
                    
                    if(response.headers['set-cookie']){
                        console.log(`Setting COOKIES`)
                        COOKIES = response.headers["set-cookie"]
                    }
                    return resolve(response.data.d.results)
                }
            })
            .catch((err) => {
                console.error("Error calling ByD -" + err)
                console.log(err.toJSON())
                reject(new Error(err));
            })
    })
}

function quotes(val) {
    return "%27" + val + "%27";
}