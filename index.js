const core = require('@actions/core');
const { BlobServiceClient, AnonymousCredential } = require("@azure/storage-blob");
const path = require('path');
const child_process = require("child_process");
require('dotenv').config()

async function uploadLocalFile(containerClient, filePath) {
    filePath = path.resolve(filePath);
    const fileName = path.basename(filePath);

    const blobClient = containerClient.getBlobClient(fileName);
    const blockBlobClient = blobClient.getBlockBlobClient();

    console.log('Uploading test artifacts.');
    await blockBlobClient.uploadFile(filePath);
    return blockBlobClient.url;
}

async function main() {
    try {
        // inputs from action
        const accountName = process.env.ACCOUNT_NAME;
        const accountSas = process.env.ACCOUNT_SAS;
        const artifactPath = core.getInput('artifacts_dir');

        // Zip artifacts
        child_process.execSync(`zip -r artifacts-${process.env.GITHUB_RUN_ID} ${artifactPath}`);

        const anonymousCredential = new AnonymousCredential();
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net${accountSas}`,
            anonymousCredential
        );

        const containerName = 'test-artifacts';
        const containerClient = blobServiceClient.getContainerClient(containerName);
        var logsUrl = await uploadLocalFile(containerClient, artifactPath+`-${process.env.GITHUB_RUN_ID}.zip`);
        console.log(`Test artifacts: ${logsUrl}`);

    } catch (error) {
        core.setFailed(error.message);
    }
}

main();
