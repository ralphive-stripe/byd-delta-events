/** This function creates a Stripe invoice and send a tweet to @ralphive about it */

const AWS = require("aws-sdk");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);

exports.lambdaHandler = async (event, context) => {
    console.log(`Let's operate the stripe Magic! 🪄`)

    const response = {
        'statusCode': 200,
    }
    try {
        const salesOrder = JSON.parse(event.Records[0].Sns.Message)
        console.log(`Processing order ${salesOrder.ID} for Stripe`)
        const items = salesOrder.Item
        let stripePromises = [];

        items.forEach(item => {
            console.log(`Preparing Item ${item.ID} - ${item.Description} Promise`)
            const invoiceItemOptions = {
                customer: process.env.STRIPE_CUSTOMER,
                description: item.Description,
                currency: item.NetAmountCurrencyCode,
                quantity: parseInt(item.ItemScheduleLine[0].Quantity) || 1,
                unit_amount: (item.NetAmount / item.ItemScheduleLine[0].Quantity * 100) || item.NetAmount
            }

            stripePromises.push(stripe.invoiceItems.create(invoiceItemOptions))
        })

        await Promise.all(stripePromises)
        console.log("ALL Invoice Items Created")

        console.log("Generating invoice...")
        let invoice = await stripe.invoices.create({
            customer: process.env.STRIPE_CUSTOMER,
            description: `FROM SAP - ${salesOrder.Name} - #${salesOrder.ID}`,
            metadata:{id:salesOrder.ID, type: salesOrder.GenericType}
        });

        if (!invoice.id) {
            console.error("ERROR Generating Invoice")
            console.error(invoice)
            return response;
        }

        console.log("Finalizing invoice...")
        invoice = await stripe.invoices.finalizeInvoice(invoice.id);

        if (!invoice.id) {
            console.error("ERROR Finalizing Invoice")
            console.error(invoice)
            return response;
        }

        console.log("Tweeting Invoice...")
        const tweet = `Hey @Ralphive 👋 There is an invoice of ${invoice.currency.toUpperCase()} ${parseFloat(invoice.amount_due / 100)} waiting for you 🧾. PAY IT NOW!! 🔗 ${invoice.hosted_invoice_url} `
        
        var params = {
            Message: tweet,
            TopicArn: process.env.SNS_TOPIC,
            Subject: `You own ${invoice.currency.toUpperCase()} ${parseFloat(invoice.amount_due / 100)}. PAY NOW!!`
        };

        var publishSMS = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
        
        
        await publishSMS.then(
            function (data) {
                console.log("SMS passed to SNS");
            }).catch(
                function (err) {
                    console.error("Error publishing message")
                    console.error(err, err.stack);
            });
        return response;

    } catch (error) {
        console.error(error)
        return response;

    }
}

async function sendTweet(tweet) {
    // Returns Configuration Record from DynamoDB
    console.log("Sending Tweet")
    try {
        await client.post('statuses/update', {status: tweet})
        .then(function (tweet) {
            console.log(tweet);
        })
        .catch(function (error) {
            throw error;
        })

    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}