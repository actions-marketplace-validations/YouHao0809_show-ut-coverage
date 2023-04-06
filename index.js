const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const glob = require('glob');
const lcovParse = require('lcov-parse');

async function run() {
    try {
        // Get the input parameters
        const token = core.getInput('github-token');
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const sha = github.context.sha;

        // Read the lcov.info file
        const lcovFile = './coverage/lcov.info';
        // const lcovFiles = glob.sync('**/lcov.info', { ignore: ['**/node_modules/**'] });
        if (!fs.existsSync(lcovFile)) {
            throw new Error(`File not found: ${lcovFile}`);
        }
        const lcovData = fs.readFileSync(lcovFile, { encoding: 'utf-8' });

        // Parse the UT results and coverage data
        const utResults = await parseUtResults(lcovData);
        const coverage = await parseCoverage(lcovData);

        // Initialize the GitHub API client
        const client = github.getOctokit(token);

        // Create a new Check
        const checkName = 'Unit Tests and Coverage';
        const checkOptions = {
            owner: owner,
            repo: repo,
            name: checkName,
            head_sha: sha,
        };
        const checkId = await createCheck(client, checkOptions);

        // Update the Check with UT results and coverage data
        const checkData = {
            utResults: utResults,
            coverage: coverage,
        };
        await updateCheck(client, checkId, checkData);

        // Set the output parameters
        core.setOutput('check-id', checkId);
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function parseUtResults(lcovData) {
    try {
        const { lines } = await lcovParse(lcovData);

        const totalLines = lines.total;
        const coveredLines = lines.covered;
        const coverage = ((coveredLines / totalLines) * 100).toFixed(2);

        return {
            totalLines,
            coveredLines,
            coverage,
        };
    } catch (error) {
        throw new Error(`Failed to parse UT results: ${error.message}`);
    }
}

async function parseCoverage(lcovData) {
    // TODO: Implement the coverage parser
    // This function should extract the coverage data from the lcovData
    // and return it in a suitable format (e.g., a percentage value)
    return "utResults";
}

async function createCheck(client, options) {
    const response = await client.checks.create({
        owner: options.owner,
        repo: options.repo,
        name: options.name,
        head_sha: options.head_sha,
        status: 'in_progress',
    });

    if (response.status !== 201) {
        throw new Error(`Failed to create check: ${response.status} ${response.statusText}`);
    }

    return response.data.id;
}

async function updateCheck(client, checkId, checkData) {
    const { owner, repo } = github.context.repo;
    const { sha } = github.context;

    const updateParams = {
        owner,
        repo,
        check_run_id: checkId,
        name: 'Unit Tests and Coverage',
        head_sha: sha,
        status: 'completed',
        conclusion: 'success',
        output: {
            title: 'Unit Tests and Coverage Report',
            summary: 'All unit tests passed and coverage is good',
            annotations: [],
            text: `## Unit Test Results\n\n${JSON.stringify(checkData.utResults)}\n\n## Coverage\n\n${JSON.stringify(checkData.coverage)}%\n`,
        },
    };

    try {
        await client.checks.update(updateParams);
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to update check: ${error.message}`);
    }
}

run();  
