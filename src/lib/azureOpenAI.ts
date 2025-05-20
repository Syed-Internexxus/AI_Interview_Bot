// lib/azureOpenAI.ts
import { AzureOpenAI } from "openai";

// Configuration for Azure OpenAI
const options = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT_URL!, // "https://syed-mafprszo-eastus2.openai.azure.com/"
  apiKey: process.env.AZURE_OPENAI_KEY!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!, // "gpt-4.1" or whatever your deployment name is
  apiVersion: "2024-04-01-preview"
};

// Create the client
export const openai = new AzureOpenAI(options);