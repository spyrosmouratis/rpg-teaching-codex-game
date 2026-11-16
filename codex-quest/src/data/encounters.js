const normal = (name, icon, topic, question, choices, defence, defopts, defbest, detail) => ({ kind: 'normal', name, icon, topic, question, choices: choices.map(([label, damage, why]) => ({ label, damage, why })), defence, defopts, defbest, detail });
const elite = (name, icon, topic, question, choices, defence, defopts, defbest, detail) => ({ kind: 'elite', name, icon, topic, question, choices: choices.map(([label, damage, why]) => ({ label, damage, why })), defence, defopts, defbest, detail });
const roster = [
    normal('The Vague Imp', '👾', 'Prompting basics', 'A payment-report script fails on startup. What instruction should you give Codex?', [
        ['Fix my code.', 25, 'The objective is understandable but gives Codex almost nothing to anchor its investigation.'], ['Find why the payment report fails and fix it.', 50, 'Better: Codex has an objective, but success criteria and scope are still missing.'], ['Inspect the payment-report script, reproduce the failure, make the smallest fix, run its relevant tests, and summarise what changed.', 75, 'Best: investigation, constrained implementation, verification, and a reviewable result.']
    ], 'Codex wants to modify a configuration file unrelated to the report. What should you do?', ['Approve it because the fix looks urgent.', 'Ask why the change is necessary and inspect the diff.', 'Ignore it and run the script without reviewing.'], 1, 'Scope changes to the task and review unexpected edits.'),
    normal('Context Bat', '🦇', 'Repository context', 'You need a change in a large repository. Which instruction gives Codex the best starting point?', [
        ['Make the dashboard faster.', 25, 'Too broad for a large repo.'], ['Inspect src/dashboard and identify the rendering bottleneck before editing. Avoid changing unrelated modules; measure the result.', 75, 'Best: a targeted path, investigation step, scope, and measurable result.'], ['Rewrite the whole frontend to improve performance.', 20, 'High-risk scope expansion before the bottleneck is understood.']
    ], 'Codex says it needs a folder you have not reviewed. Your response?', ['Provide the relevant path or files and ask it to inspect them.', 'Give it broad access to everything without checking.', 'Tell it to invent the missing context.'], 0, 'Explicit repository context beats guessing.'),
    normal('Scope Slime', '🟢', 'Controlling scope', 'You only need one small UI label changed. Which request is most effective?', [
        ['Refactor the page and rename everything to improve consistency.', 20, 'This turns a small task into unnecessary work.'], ['Update the submit button label in the checkout view, leave behaviour unchanged, and confirm no other files changed.', 75, 'Focused request with explicit invariants.'], ['Fix the button and anything else that seems wrong.', 40, 'May work, but invites unrelated edits.']
    ], 'Codex modifies six files for a one-line text change. What do you do?', ['Merge it because it must know best.', 'Ask for an explanation and request a narrower diff if not needed.', 'Delete the entire repository to start over.'], 1, 'The safe defence is to challenge unexplained scope growth.'),
    normal('Regression Ghoul', '💀', 'Verification', 'Codex reports that a bug is fixed. What is the strongest next instruction?', [
        ['Looks good, stop now.', 20, 'No verification means the fix is unproven.'], ['Explain your change.', 45, 'A helpful summary, but not evidence that the change works.'], ['Add a regression test for the failing case, run it and the relevant suite, and report any failures.', 75, 'A reproducible test makes the repair more reliable.']
    ], 'A test fails after a code change. What should you defend against?', ['Treat the failure as evidence to investigate before approval.', 'Delete the failing test so the build passes.', 'Ignore the result because the agent was confident.'], 0, 'Failed tests are feedback, not obstacles to hide.'),
    normal('Diff Sprite', '🧚', 'Reviewing code', 'Codex finished a change. How do you request a useful review?', [
        ['Summarise the changed files, important logic changes, test results and remaining risks; show the diff for review.', 75, 'Best: a reviewable account of changes and evidence.'], ['Say it is complete and close the task.', 25, 'Completion alone is not a review.'], ['Show me how many lines were changed.', 45, 'Diff size is useful but does not prove quality.']
    ], 'The diff contains a new hard-coded API token. What is your defensive move?', ['Leave it, the code now works.', 'Publish the branch and rotate the key later.', 'Stop, remove the credential, and handle the exposure appropriately.'], 2, 'Secrets should not be committed, even when code works.'),
    normal('Permission Shade', '👻', 'Sandbox & permissions', 'A task requires inspecting project files but not editing them. Which approach is best?', [
        ['Keep work read-only and ask Codex to analyse the files and report findings.', 75, 'Least necessary privilege matches the task.'], ['Allow unrestricted filesystem access before asking the question.', 20, 'Unneeded permissions add risk.'], ['Tell Codex not to read any files and guess the issue.', 25, 'Would remove the evidence needed to answer.']
    ], 'Codex asks to run a destructive command. What should you do?', ['Approve all commands to save time.', 'Review the exact command and impact; deny or narrow it if unnecessary.', 'Disable logging so nothing can go wrong.'], 1, 'Approval gates exist to preserve control over consequential operations.'),
    normal('Thread Specter', '🪄', 'Iterating with Codex', 'Codex has diagnosed an issue on a thread. You now want it to implement the proposed fix. What should you do?', [
        ['Continue on the same thread with the next instruction and test requirement.', 75, 'Continuing preserves the relevant conversation context.'], ['Start an unrelated new thread with “Do it” and no context.', 20, 'The reference to previous findings is lost.'], ['Ask it to repeat the diagnosis indefinitely.', 40, 'May add confidence but does not progress implementation.']
    ], 'The implementation differs from the agreed plan. What do you do?', ['Inspect the difference and request a justified correction or updated plan.', 'Assume every deviation is an improvement.', 'Throw away the entire task history immediately.'], 0, 'Iterate against agreed intent rather than accepting unexplained changes.'),
    elite('The Async Sentinel', '⚙️', 'Code selection · TypeScript', 'You are inside an async TypeScript function. Choose the cleanest code that gets a Codex thread response.', [
        ['const result = thread.run("Investigate test failures");\nconsole.log(result.finalResponse);', 20, 'run() returns a promise: finalResponse is not ready until it resolves.'], ['const result = await thread.run("Investigate test failures");\nconsole.log(result.finalResponse);', 75, 'Best: await the asynchronous run and read the response.'], ['thread.run("Investigate test failures").then(r => console.log(r.finalResponse));', 60, 'This works in many contexts, but await is clearer inside an existing async function.'], ['const result = await codex.run("Investigate test failures");\nconsole.log(result.finalResponse);', 15, 'The documented SDK uses a thread to run a task, not codex.run().']
    ], 'The call rejects with an error. What is a robust response?', ['Swallow the error and claim success.', 'Record/report the failure and decide whether a safe retry is appropriate.', 'Return a fake success message.'], 1, 'Async errors need visible handling, not silent failure.'),
    elite('The Thread Hydra', '🐉', 'Code selection · SDK lifecycle', 'You want Codex to investigate a CI failure, then implement its plan using the same context. Choose the best code.', [
        ['const a = codex.startThread();\nawait a.run("Diagnose CI");\nconst b = codex.startThread();\nawait b.run("Implement the plan");', 25, 'The second independent thread may not have the first thread’s context.'], ['const thread = codex.startThread();\nawait thread.run("Diagnose CI");\nconst result = await thread.run("Implement the plan");', 75, 'Best: both turns share one thread.'], ['await codex.run("Diagnose CI and implement it");', 15, 'That is not the documented thread-based SDK interface.'], ['const thread = codex.startThread();\nconst a = thread.run("Diagnose CI");\nconst b = thread.run("Implement the plan");', 30, 'Without awaiting the diagnosis, the intended sequencing is not established.']
    ], 'You are about to run code from an untrusted repository. What is the best default?', ['Use an appropriately restricted environment and inspect requested permissions.', 'Disable sandbox controls so the command never blocks.', 'Assume repository code is harmless.'], 0, 'Agent execution should respect the necessary sandbox and approval settings.')
];

const promptPool = [
    ['A change touches files outside the requested feature. Which follow-up keeps the work focused?', ['Keep the extra edits because more files means a better result.', 'Ask why each extra file changed and narrow the diff to what the feature needs.', 'Delete every changed file and start over.'], 1],
    ['A bug report is missing useful detail. What should you ask Codex to do first?', ['Reproduce the issue and report the exact steps and observed result.', 'Rewrite the whole application from scratch.', 'Guess at a fix without inspecting the project.'], 0],
    ['You want a small change to stay easy to review. What belongs in the request?', ['The goal, relevant area, boundaries, and how to verify it.', 'A vague goal and permission to change anything.', 'Only “make it better”.'], 0],
    ['Codex says it completed a task. What makes that claim useful?', ['A concise summary with the checks it actually ran and their results.', 'A confident “done” with no details.', 'A list of unrelated improvements it might make later.'], 0],
    ['A proposed fix changes behaviour beyond the bug report. What is the best next step?', ['Ask for the reason and compare the change with the requested outcome.', 'Accept it because broad changes are always safer.', 'Skip review and merge immediately.'], 0],
    ['The task depends on a file Codex has not seen. What should you do?', ['Share the relevant path or ask it to inspect that file.', 'Ask it to invent the missing details.', 'Grant access to unrelated systems.'], 0],
    ['A result is uncertain after the first attempt. What is the best next instruction?', ['Give the observed result and ask for a focused adjustment and verification.', 'Repeat the same request without new evidence.', 'Declare success without checking.'], 0],
    ['You need Codex to work in an unfamiliar part of the repo. What is the safest first step?', ['Ask it to inspect the relevant files and explain the existing flow before changing them.', 'Tell it to replace the unfamiliar area immediately.', 'Ask it to guess the architecture from the folder names.'], 0],
    ['A review finds a bug in the proposed solution. What should happen next?', ['Share the finding and request a targeted correction plus a relevant check.', 'Ignore it because the original task is already complete.', 'Make unrelated changes to compensate.'], 0],
];

const codePool = [
    ['Which snippet waits for the Codex response before reading it?', [
        'const result = thread.run(task);\nreturn result.finalResponse;',
        'const result = await thread.run(task);\nreturn result.finalResponse;',
        'return thread.finalResponse;'
    ], 1],
    ['Which snippet keeps diagnosis and implementation in the same thread?', [
        'const thread = codex.startThread();\nawait thread.run("Diagnose");\nawait thread.run("Implement");',
        'await codex.startThread().run("Diagnose");\nawait codex.startThread().run("Implement");',
        'const result = codex.run("Diagnose and implement");'
    ], 0],
    ['Which snippet reports a failed async operation instead of hiding it?', [
        'try { await thread.run(task); } catch (error) { console.error(error); }',
        'try { await thread.run(task); } catch { return "success"; }',
        'thread.run(task); // assume it worked'
    ], 0],
    ['Which snippet waits for two independent read-only checks before summarising?', [
        'const results = await Promise.all([checkFiles(), checkDocs()]);\nreturn summarise(results);',
        'const results = Promise.all([checkFiles(), checkDocs()]);\nreturn summarise(results);',
        'return summarise([checkFiles(), checkDocs()]);'
    ], 0],
    ['Which snippet preserves a useful error while still surfacing failure?', [
        'try { return await thread.run(task); } catch (error) { throw new Error("Codex run failed", { cause: error }); }',
        'try { return await thread.run(task); } catch { return { finalResponse: "done" }; }',
        'thread.run(task).catch(() => undefined);'
    ], 0],
    ['Which snippet ensures cleanup runs whether the request succeeds or fails?', [
        'try { await thread.run(task); } finally { await closeSession(); }',
        'try { await thread.run(task); } catch { await closeSession(); }',
        'await thread.run(task); await closeSession(); // only runs after success'
    ], 0],
    ['Which snippet avoids starting the second task before the first has finished?', [
        'await thread.run("Inspect");\nawait thread.run("Implement the agreed fix");',
        'thread.run("Inspect");\nthread.run("Implement the agreed fix");',
        'const first = thread.run("Inspect");\nconst second = thread.run("Implement");'
    ], 0],
    ['Which snippet checks the response before using it?', [
        'const result = await thread.run(task);\nif (!result.finalResponse) throw new Error("No response");\nreturn result.finalResponse;',
        'const result = await thread.run(task);\nreturn result.finalResponse.toUpperCase();',
        'return (await thread.run(task)).finalResponse.toUpperCase();'
    ], 0],
    ['Which snippet uses a single thread for a diagnosis and its follow-up?', [
        'const thread = codex.startThread();\nconst diagnosis = await thread.run("Diagnose");\nconst fix = await thread.run(`Address: ${diagnosis.finalResponse}`);',
        'const diagnosis = await codex.startThread().run("Diagnose");\nconst fix = await codex.startThread().run("Address it");',
        'const diagnosis = thread.run("Diagnose");\nconst fix = thread.run("Address it");'
    ], 0],
    ['Which snippet returns a string from an async TypeScript function?', [
        'async function getReply(): Promise<string> {\n  return "Ready";\n}',
        'async function getReply(): string {\n  return "Ready";\n}',
        'function getReply(): Promise<string> {\n  return "Ready";\n}'
    ], 0],
    ['Which snippet records a failure and then lets the caller decide what to do?', [
        'try { return await thread.run(task); } catch (error) { logger.error({ error }); throw error; }',
        'try { return await thread.run(task); } catch (error) { logger.error({ error }); return null; }',
        'try { return await thread.run(task); } catch { logger.info("success"); }'
    ], 0],
    ['Which snippet keeps an optional value safe before reading a property?', [
        'const response = result?.finalResponse ?? "No response";',
        'const response = result.finalResponse || "No response"; // result may be undefined',
        'const response = result.finalResponse ?? "No response"; // result may be undefined'
    ], 0],
];

const writePool = [
    ['Write a TypeScript function signature for an async function named `runTask` that accepts a string called `task` and returns a Promise of a string.', [/async\s+function\s+runTask\s*\(\s*task\s*:\s*string\s*\)\s*:\s*Promise\s*<\s*string\s*>/, /const\s+runTask\s*=\s*async\s*\(\s*task\s*:\s*string\s*\)\s*:\s*Promise\s*<\s*string\s*>/]],
    ['Write a TypeScript line that awaits `thread.run(task)` and stores its result in a variable named `result`.', [/const\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/, /let\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/]],
    ['Write a TypeScript line that returns the Codex response from `result.finalResponse`.', [/return\s+result\.finalResponse\s*;?/]],
    ['Write a TypeScript line that creates a new Codex instance and stores it in `codex`.', [/const\s+codex\s*=\s*new\s+Codex\s*\(\s*\)/, /let\s+codex\s*=\s*new\s+Codex\s*\(\s*\)/]],
    ['Write a TypeScript line that starts a Codex thread and stores it in `thread`.', [/const\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/, /let\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/]],
    ['Write a TypeScript `try/catch` that awaits `thread.run(task)` and logs the caught error.', [/try\s*\{[\s\S]*await\s+thread\.run\s*\(\s*task\s*\)[\s\S]*catch\s*\(\s*error\s*\)[\s\S]*console\.error\s*\(\s*error\s*\)/]],
    ['Write a TypeScript line that creates a Codex thread and stores it in `thread`.', [/const\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/, /let\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/]],
    ['Write a TypeScript line that awaits `thread.run(task)` and stores its response in `result`.', [/const\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/, /let\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/]],
    ['Provide the return statement that passes the Codex output in `result.finalResponse` back to the caller.', [/return\s+result\.finalResponse\s*;?/]],
];

const bonusPromptQuestions = [
    ['A bug only appears after a particular sequence of actions. What should you ask Codex to do?', 'Reproduce that sequence, record the actual result, and compare it with the expected result.', 'Change the first related file it finds.', 'Remove the sequence from the user workflow.'],
    ['A task has a strict deadline. Which request helps keep the work useful and reviewable?', 'Ask for the smallest change that meets the stated acceptance criteria, then report any remaining gaps.', 'Skip investigation and verification to save time.', 'Add optional improvements before the required fix.'],
    ['Codex proposes a new package for a small helper. What should you ask?', 'Explain why the dependency is needed and whether the existing project tools can do the job.', 'Install it immediately without checking its purpose.', 'Replace the package manager to make room for it.'],
    ['A test fails intermittently. What is the best first response?', 'Capture the failing conditions and investigate whether timing or shared state causes the flake.', 'Delete the test because it is unreliable.', 'Retry until it passes and report only that run.'],
    ['A change updates a public function. What should you ask Codex to check?', 'Find its callers and update or preserve compatibility as the task requires.', 'Rename every nearby function.', 'Assume no callers exist.'],
    ['The repository has no test for the reported bug. What is a useful request?', 'Add a focused regression check if practical, then run it and report its limits.', 'Claim the bug is fixed based on the diff alone.', 'Add a test that always passes.'],
    ['A code edit changes formatting across many unrelated lines. What should you do?', 'Ask to separate unrelated formatting from the functional change where possible.', 'Accept it because a larger diff is easier to inspect.', 'Discard the entire feature without reviewing it.'],
    ['You need a UI change to preserve keyboard access. What belongs in the prompt?', 'State the keyboard interaction and accessibility behavior that must remain available.', 'Ask only for matching colors.', 'Ask Codex to remove focus indicators.'],
    ['An error report includes a stack trace. How can Codex use it well?', 'Ask it to trace the failing path, reproduce the error, and fix the underlying cause.', 'Ask it to hide the stack trace from users.', 'Ask it to rewrite unrelated modules first.'],
    ['A task involves several files. What helps prevent missed requirements?', 'List the expected behavior and ask for a brief plan before broad edits.', 'Leave success criteria unstated.', 'Tell Codex to edit files in alphabetical order.'],
    ['A proposed solution includes a database migration. What should you verify?', 'Review the schema impact, rollback needs, and data safety before applying it.', 'Apply it to production immediately.', 'Delete the old data to avoid a migration.'],
    ['Codex cannot run a required check in the environment. What should its summary say?', 'Name the check that could not run and explain what evidence is still missing.', 'Say all checks passed anyway.', 'Remove the check from the project.'],
    ['A request asks for a performance improvement. What evidence is most useful?', 'Measure the current behavior and compare the same measurement after the change.', 'Choose the fastest-looking code by inspection only.', 'Remove features until the page is smaller.'],
    ['An unfamiliar command would delete generated files. What is the safe next move?', 'Inspect exactly which paths it removes and confirm they can be regenerated before running it.', 'Run it with broader permissions.', 'Hide the command from the review.'],
    ['A prompt asks Codex to “clean up” a module. How can you reduce ambiguity?', 'Name the specific cleanup goal and behavior that must not change.', 'Ask it to make whatever changes seem elegant.', 'Ask it to rename the module and stop.'],
    ['A fix depends on an environment variable. What should you ask Codex to do?', 'Trace where it is configured and document any required setup without adding secrets.', 'Hard-code a real credential into the source.', 'Assume every environment defines it.'],
    ['The change may affect older clients. What should Codex inspect?', 'Compatibility expectations and tests for the supported older behavior.', 'Only the newest client path.', 'The project logo and color palette.'],
    ['Codex says it used a test but gives no details. What follow-up is useful?', 'Ask for the exact command and the result it observed.', 'Assume the test passed.', 'Ask it to remove the test output.'],
    ['A request has two independent parts. What makes completion easy to review?', 'Ask for each part to be addressed and summarized separately with its checks.', 'Ask for one vague “done” message.', 'Tell Codex to omit the changed-file list.'],
    ['A dependency update changes a lockfile. What should you check?', 'Confirm the intended package versions changed and no unrelated dependency churn appeared.', 'Delete the lockfile to reduce the diff.', 'Ignore the lockfile in review.'],
    ['A visual fix is complete. What is the most useful verification?', 'Inspect the relevant layout at the affected viewport sizes and report what was checked.', 'Verify only that the JavaScript parses.', 'Assume CSS changes look right without opening the page.'],
    ['An agent suggests a shell command with a broad path. What should you do?', 'Narrow the path and inspect the exact effect before approving the command.', 'Approve it because the command is familiar.', 'Disable the sandbox to avoid a prompt.'],
    ['The task includes user-provided text. What should the implementation consider?', 'Treat it as untrusted input and preserve the project’s validation and escaping rules.', 'Insert it directly into HTML.', 'Assume the text cannot contain markup.'],
    ['A feature is partly complete but blocked by missing information. What should Codex report?', 'What is done, the specific missing information, and the next decision needed.', 'Claim the whole feature is complete.', 'Make up a requirement and continue silently.'],
    ['A code review finds a possible security issue. What is the right response?', 'Investigate the finding and address or clearly explain it before declaring completion.', 'Dismiss it because the feature works.', 'Move the code to a different file.'],
    ['You want to preserve an existing API while changing internals. What instruction helps?', 'State the public API as an invariant and ask for compatibility checks.', 'Ask Codex to modernize every signature.', 'Avoid mentioning callers.'],
    ['A script writes files as a side effect. What should you request before running it?', 'Explain the files it will write and use a safe preview or dry run if available.', 'Run it against the only copy of the data.', 'Suppress its output.'],
    ['A change introduces a new configuration option. What else should be considered?', 'Defaults, validation, documentation, and behavior when the option is absent.', 'Only the option name.', 'A hard-coded value in every caller.'],
    ['A bug occurs only on one platform. What should the investigation include?', 'The affected platform details and a comparison with a working environment.', 'A full rewrite without checking platform differences.', 'Deleting platform-specific checks.'],
    ['The task is to update documentation for changed behavior. What should you verify?', 'The docs describe the actual implementation and include the relevant usage or limitation.', 'The docs use more words than before.', 'The docs promise behavior that is not implemented.'],
    ['Codex completed the implementation but not the requested summary. What should you ask?', 'Provide the changed files, verification performed, and any known limitation.', 'Start a new unrelated task.', 'Ask it to report success without evidence.'],
    ['A requested change risks overwriting local work. What should happen first?', 'Inspect the working tree and preserve unrelated edits before changing files.', 'Reset the repository automatically.', 'Overwrite the files and reconstruct changes later.'],
];

const bonusCodeQuestions = [
    ['Which snippet checks a value before calling a string method?', 'if (typeof value === "string") { return value.trim(); }', 'return value.trim(); // value may be null', 'return String(value).trim(); // silently changes non-string inputs'],
    ['Which snippet stops after the first failed required check?', 'for (const check of checks) { if (!check.ok) throw new Error(check.name); }', 'for (const check of checks) { if (!check.ok) console.log(check.name); }\nreturn "passed";', 'checks.forEach(async check => { if (!check.ok) throw new Error(check.name); });'],
    ['Which snippet avoids swallowing a rejected promise?', 'try { await save(); } catch (error) { logger.error(error); throw error; }', 'try { await save(); } catch { return "saved"; }', 'save().catch(() => undefined);'],
    ['Which snippet validates a required string argument?', 'if (!task.trim()) throw new Error("task is required");', 'if (task === undefined) return "success";', 'task.trim(); // continue even if task is empty'],
    ['Which snippet waits for a sequential dependency?', 'const plan = await inspect();\nconst result = await implement(plan);', 'const plan = inspect();\nconst result = implement(plan);', 'const plan = await inspect();\nconst result = implement("guess");'],
    ['Which snippet handles an absent optional response?', 'const text = result?.finalResponse ?? "No response";', 'const text = result.finalResponse;', 'const text = result.finalResponse || result.finalResponse.trim();'],
    ['Which snippet avoids mutating the original list while filtering?', 'const relevant = files.filter(file => file.endsWith(".ts"));', 'const relevant = files.splice(0, files.length);', 'const relevant = files.sort(); // mutates files'],
    ['Which snippet preserves the original error as the cause?', 'throw new Error("Task failed", { cause: error });', 'throw new Error("Task failed"); // discard the original error', 'return new Error("Task failed");'],
    ['Which snippet awaits all independent checks before combining results?', 'const [lint, types] = await Promise.all([runLint(), runTypes()]);', 'const [lint, types] = Promise.all([runLint(), runTypes()]);', 'const lint = runLint();\nconst types = runTypes();\nreturn combine(lint, types);'],
    ['Which snippet gives a function an explicit async return type?', 'async function runTask(task: string): Promise<string> { return task; }', 'async function runTask(task: string): string { return task; }', 'function runTask(task: string): Promise<string> { return task; }'],
    ['Which snippet logs a failure without claiming the operation succeeded?', 'try { await publish(); } catch (error) { logger.error({ error }); throw error; }', 'try { await publish(); } catch (error) { logger.info("published"); }', 'await publish().catch(() => "published");'],
    ['Which snippet prevents an empty response from being treated as a success?', 'if (!result.finalResponse?.trim()) throw new Error("Empty response");', 'if (result.finalResponse) return "success";', 'return result.finalResponse ?? "success";'],
    ['Which snippet processes items in order when each uses the previous result?', 'for (const item of items) { await processItem(item); }', 'items.forEach(async item => await processItem(item));', 'items.map(item => processItem(item));'],
    ['Which snippet adds context from the previous result to a follow-up turn?', 'const first = await thread.run("Inspect the failure");\nawait thread.run(`Fix based on: ${first.finalResponse}`);', 'await codex.startThread().run("Inspect the failure");\nawait codex.startThread().run("Fix it");', 'const first = thread.run("Inspect");\nawait thread.run(first.finalResponse);'],
    ['Which snippet uses a `finally` block for cleanup?', 'try { await run(); } finally { await close(); }', 'try { await run(); } catch { await close(); }', 'await run();\nawait close(); // skipped if run rejects'],
    ['Which snippet checks that an array contains a requested item?', 'if (!items.includes(target)) throw new Error("Missing item");', 'if (items.indexOf(target) < -1) throw new Error("Missing item");', 'if (items.includes(target)) throw new Error("Missing item");'],
    ['Which snippet returns the awaited function result from an async wrapper?', 'async function run() { return await task(); }', 'async function run() { task(); }', 'function run() { return await task(); }'],
    ['Which snippet reports a failed check instead of changing the check?', 'if (!check.ok) throw new Error(`Check failed: ${check.name}`);', 'if (!check.ok) check.ok = true;', 'if (!check.ok) delete check;'],
    ['Which snippet catches a rejected promise at the call site?', 'await save().catch(error => { logger.error(error); throw error; });', 'save().catch(error => logger.error(error));\nreturn "saved";', 'save();\nreturn "saved";'],
    ['Which snippet keeps an untrusted string out of raw HTML?', 'element.textContent = userText;', 'element.innerHTML = userText;', 'document.write(userText);'],
];

const bonusWriteQuestions = [
    ['Write a TypeScript guard that throws when `task` is empty or only whitespace.', [/if\s*\(\s*!task\.trim\(\)\s*\)\s*throw\s+new\s+Error/]],
    ['Write a TypeScript line that returns `result.finalResponse` from the current function.', [/return\s+result\.finalResponse\s*;?/]],
    ['Write an `async function runTask` signature that accepts `task: string` and returns `Promise<string>`.', [/async\s+function\s+runTask\s*\(\s*task\s*:\s*string\s*\)\s*:\s*Promise\s*<\s*string\s*>/]],
    ['Write a TypeScript `try/catch` that awaits `save()` and rethrows the caught `error`.', [/try\s*\{[\s\S]*await\s+save\s*\(\s*\)[\s\S]*catch\s*\(\s*error\s*\)[\s\S]*throw\s+error/]],
    ['Write a TypeScript line that awaits `thread.run(task)` and stores the result in `result`.', [/const\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/, /let\s+result\s*=\s*await\s+thread\.run\s*\(\s*task\s*\)/]],
    ['Write the TypeScript statement that opens a new thread from `codex` and assigns it to `thread`.', [/const\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/, /let\s+thread\s*=\s*codex\.startThread\s*\(\s*\)/]],
    ['Write a TypeScript guard that throws when `result.finalResponse` is empty.', [/if\s*\(\s*!result\.finalResponse\?\.trim\(\)\s*\)\s*throw\s+new\s+Error/]],
    ['Write a TypeScript line that uses `Promise.all` and awaits `runLint()` and `runTypes()`.', [/await\s+Promise\.all\s*\(\s*\[\s*runLint\s*\(\s*\)\s*,\s*runTypes\s*\(\s*\)\s*\]\s*\)/]],
    ['Write a TypeScript line that safely displays `userText` as text using `textContent`.', [/\.textContent\s*=\s*userText\s*;?/]],
    ['Write a TypeScript `finally` block that calls `close()` after an operation.', [/finally\s*\{\s*await\s+close\s*\(\s*\)\s*;?\s*\}/]],
    ['Write a TypeScript statement that throws an `Error` when `check.ok` is false.', [/if\s*\(\s*!check\.ok\s*\)\s*throw\s+new\s+Error/]],
    ['Write a TypeScript line that awaits `processItem(item)` inside a `for...of` loop.', [/for\s*\(\s*const\s+\w+\s+of\s+\w+\s*\)\s*\{\s*await\s+processItem\s*\(\s*\w+\s*\)\s*;?\s*\}/]],
];

function choiceQuestion(type, prompt, correctAnswer, distractors, seed) {
    const correctIndex = seed % 3;
    let distractorIndex = 0;
    const choices = Array.from({ length: 3 }, (_, i) => {
        if (i === correctIndex) return { label: correctAnswer, correct: true };
        return { label: distractors[distractorIndex++], correct: false };
    });
    return { type, prompt, choices };
}

function buildBonusQuestionBank() {
    const questions = [];
    for (let i = 0; i < bonusPromptQuestions.length; i++) {
        const [prompt, correct, ...distractors] = bonusPromptQuestions[i];
        questions.push(choiceQuestion('prompt', prompt, correct, distractors, i));
        if (i < bonusCodeQuestions.length) {
            const [codePrompt, codeCorrect, ...codeDistractors] = bonusCodeQuestions[i];
            questions.push(choiceQuestion('choose-code', codePrompt, codeCorrect, codeDistractors, i + 1));
        }
        if (i < bonusWriteQuestions.length) {
            const [writePrompt, patterns] = bonusWriteQuestions[i];
            questions.push({ type: 'write-code', prompt: writePrompt, accepted: patterns.map(pattern => pattern.source) });
        }
    }
    return questions;
}

const bonusQuestionBank = buildBonusQuestionBank();

const tiers = ['easy', 'medium', 'easy', 'medium', 'elite', 'easy', 'medium', 'medium', 'elite'];
const illustratedRoster = roster.map((mob, sprite) => {
    const legacyCorrect = mob.choices.reduce((best, choice, i, all) => choice.damage > all[best].damage ? i : best, 0);
    const attackQuestions = [{
        type: mob.kind === 'elite' ? 'choose-code' : 'prompt',
        prompt: mob.question,
        choices: mob.choices.map((choice, i) => ({ label: choice.label, correct: i === legacyCorrect })),
    }];
    const extraPrompt = promptPool[sprite];
    attackQuestions.push({
        type: 'prompt', prompt: extraPrompt[0],
        choices: extraPrompt[1].map((label, i) => ({ label, correct: i === extraPrompt[2] })),
    });
    const codeQuestion = codePool[sprite % codePool.length];
    attackQuestions.push({
        type: 'choose-code', prompt: codeQuestion[0],
        choices: codeQuestion[1].map((label, i) => ({ label, correct: i === codeQuestion[2] })),
    });
    const writeQuestion = writePool[sprite];
    attackQuestions.push({ type: 'write-code', prompt: writeQuestion[0], accepted: writeQuestion[1].map(pattern => pattern.source) });
    const hp = tiers[sprite] === 'easy' ? 20 : tiers[sprite] === 'medium' ? 40 : 60;
    return { ...mob, sprite, difficulty: tiers[sprite], hp, attackQuestions, defenceDamage: 10 };
});

bonusQuestionBank.forEach((question, index) => {
    illustratedRoster[index % illustratedRoster.length].attackQuestions.push(question);
});

// Mix prompt battles with both code duels so the campaign ramps in variety,
// while keeping the dragon as the separate final encounter.
export const mobs = [
    illustratedRoster[0], // The Vague Imp
    illustratedRoster[7], // The Async Sentinel
    illustratedRoster[4], // Diff Sprite
    illustratedRoster[1], // Context Bat
    illustratedRoster[8], // The Thread Hydra
    illustratedRoster[2], // Scope Slime
    illustratedRoster[5], // Permission Shade
    illustratedRoster[3], // Regression Ghoul
    illustratedRoster[6]  // Thread Specter
];
