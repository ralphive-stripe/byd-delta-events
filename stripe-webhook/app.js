const stripe = require('stripe');
const AWS = require("aws-sdk");

exports.lambdaHandler = async (event, context) => {
    let stripeEvent;
    let response = { 'statusCode': 200 }

    try {
        stripeEvent = JSON.parse(event.body);
        console.log(" stripe event received")
    } catch (err) {
        console.error(err.message)
        response.statusCode = 400
        response.body = `Webhook Error: ${err.message}`;
        return;
    }


    // Handle the event
    switch (stripeEvent.type) {
        case 'invoice.paid':
            console.log(`Event type ${stripeEvent.type}`);
            const invoice = stripeEvent.data.object;

            var params = {
                Message: JSON.stringify(invoice),
                TopicArn: process.env.SNS_TOPIC
            };

            var publishStripeEvent = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
            
            // Handle promise's fulfilled/rejected states
            await publishStripeEvent.then(
                function (data) {
                    console.log("Event received and passed to SNS");
                    console.log("MessageID is " + data.MessageId);
                }).catch(
                    function (err) {
                        console.error("Error publishing message")
                        console.error(err, err.stack);
                });
            break;
        default:
            console.log(`Unhandled event type ${stripeEvent.type}`);
    }
    return response
}