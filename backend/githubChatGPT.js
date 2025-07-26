require('dotenv').config();
     const { OpenAI } = require('@openai/openai');
     const { Octokit } = require('@octokit/core');

     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
     const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

     async function generatePRDescription(prNumber) {
       try {
         const { data: pr } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
           owner: 'LyricsDunia',
           repo: 'ynp-prototype',
           pull_number: prNumber,
         });

         const prompt = `Generate a concise PR description for the following changes:\nTitle: ${pr.title}\nCommits: ${pr.commits}\nDiff: ${pr.diff_url}\nSummarize the changes and their purpose.`;
         const response = await openai.chat.completions.create({
           model: 'gpt-4o',
           messages: [{ role: 'user', content: prompt }],
           max_tokens: 150,
         });

         const description = response.choices[0].message.content;

         await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
           owner: 'LyricsDunia',
           repo: 'ynp-prototype',
           pull_number: prNumber,
           body: description,
         });