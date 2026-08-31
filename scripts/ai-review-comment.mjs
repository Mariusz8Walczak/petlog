#!/usr/bin/env node
// Formats the actions/ai-inference JSON response into a PR comment body,
// and writes `verdict=<approve|changes_requested>` to $GITHUB_OUTPUT so the
// workflow can gate the job on blocking criteria.
//
// Usage: node scripts/ai-review-comment.mjs <response-file> <out-comment-file>

import { readFileSync, writeFileSync } from 'node:fs';

const [, , responsePath, outCommentPath = 'ai-review-comment.md'] = process.argv;

if (!responsePath) {
	console.error('Usage: node ai-review-comment.mjs <response-file> [out-comment-file]');
	process.exit(1);
}

const raw = readFileSync(responsePath, 'utf-8').trim();

function extractJson(text) {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	const candidate = fenced ? fenced[1] : text;
	return JSON.parse(candidate);
}

function writeOutput(verdict) {
	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) {
		writeFileSync(githubOutput, `verdict=${verdict}\n`, { flag: 'a' });
	}
}

let result;
try {
	result = extractJson(raw);
	if (!Array.isArray(result.criteria) || typeof result.verdict !== 'string') {
		throw new Error('missing criteria[] or verdict');
	}
} catch (err) {
	const body = [
		'## 🤖 AI Code Review',
		'',
		`> ⚠️ Nie udało się sparsować odpowiedzi modelu jako JSON (${err.message}). Surowa odpowiedź poniżej.`,
		'',
		'```',
		raw.slice(0, 4000),
		'```'
	].join('\n');
	writeFileSync(outCommentPath, body);
	// fail closed: an unparseable review is not a passing review
	writeOutput('changes_requested');
	console.log('verdict=changes_requested (parse failure)');
	process.exit(0);
}

const icon = (pass) => (pass ? '✅' : '❌');
const rows = result.criteria
	.map(
		(c) =>
			`| \`${c.id}\` | ${c.blocking ? 'blocking' : 'advisory'} | ${icon(c.pass)} | ${c.comment ?? ''} |`
	)
	.join('\n');

const verdictLine = result.verdict === 'approve' ? '✅ approve' : '🛑 changes requested';

const body = [
	'## 🤖 AI Code Review',
	'',
	result.summary ?? '',
	'',
	'| Kryterium | Typ | Wynik | Komentarz |',
	'|---|---|---|---|',
	rows,
	'',
	`**Werdykt:** ${verdictLine}`,
	'',
	'_Automatyczny review wg `context/foundation/code-review-criteria.md`, model przez GitHub Models (`actions/ai-inference`)._'
].join('\n');

writeFileSync(outCommentPath, body);
writeOutput(result.verdict);
console.log(`verdict=${result.verdict}`);
