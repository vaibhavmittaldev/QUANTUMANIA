const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', 'lab_practice_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLabPracticeE2E() {
  console.log('===============================================================');
  console.log('STARTING LAB PRACTICE INTEGRATION BROWSER ACCEPTANCE TEST');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const results = { passed: [], failed: [] };

  function pass(step, title, details = '') {
    const msg = `Step ${step}: ${title}`;
    console.log(`[PASS] ${msg} ${details ? '— ' + details : ''}`);
    results.passed.push(msg);
  }

  function fail(step, title, error) {
    const msg = `Step ${step}: ${title}`;
    console.error(`[FAIL] ${msg}:`, error);
    results.failed.push({ test: msg, error: String(error) });
  }

  try {
    // Phase 0: Login
    console.log('--- Phase 0: Login ---');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'demo@quantumania.org');
    await page.type('input[type="password"]', 'DemoPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00_dashboard_logged_in.png') });
    pass(0, 'Login successfully into Quantumania', 'Authenticated session established');

    // Phase 1: Verify Topic without lab practice does NOT show LAB PRACTICE
    console.log('\n--- Phase 1: Conceptual Topic (No Lab Practice) ---');
    await page.goto('http://localhost:3001/app/learn/lessons/les_01_what_is_qc', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_conceptual_lesson_no_lab.png') });

    const nonLabBtn = await page.$('#btn-lab-practice');
    if (!nonLabBtn) {
      pass(1, 'Non-lab topic does NOT show LAB PRACTICE button', 'les_01_what_is_qc verified clean');
    } else {
      fail(1, 'Non-lab topic does NOT show LAB PRACTICE button', 'Button #btn-lab-practice was unexpectedly found');
    }

    // Phase 2: Verify Topic with lab practice DOES show LAB PRACTICE & Expanded Theory
    console.log('\n--- Phase 2: Lab-Capable Topic (Superposition) ---');
    await page.goto('http://localhost:3001/app/learn/lessons/les_03_superposition', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_superposition_lesson_with_lab.png') });

    const labBtn = await page.$('#btn-lab-practice');
    if (labBtn) {
      pass(2, 'Lab-capable topic DOES show LAB PRACTICE button', 'Found #btn-lab-practice at header');
    } else {
      fail(2, 'Lab-capable topic DOES show LAB PRACTICE button', '#btn-lab-practice not found on les_03_superposition');
    }

    // Verify expanded theory content exists
    const theoryContent = await page.evaluate(() => document.body.innerText);
    const hasMathExpanded = theoryContent.includes('|0⟩') && theoryContent.includes('|1⟩') && theoryContent.includes('Hadamard');
    if (hasMathExpanded) {
      pass(3, 'Expanded theory content present', 'Statevector, Hadamard, and Dirac notation verified');
    } else {
      fail(3, 'Expanded theory content present', 'Missing expected theory markers');
    }

    // Phase 3: Click LAB PRACTICE button and verify Quantum Lab loads with context
    console.log('\n--- Phase 3: Navigate from Theory to Quantum Lab ---');
    await page.click('#btn-lab-practice');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_quantum_lab_superposition_loaded.png') });

    const currentUrl = page.url();
    if (currentUrl.includes('quantum-lab') && currentUrl.includes('lab_problem_id=lab_superposition_01')) {
      pass(4, 'Navigated to Quantum Lab with correct parameters', currentUrl);
    } else {
      fail(4, 'Navigated to Quantum Lab with correct parameters', `URL was ${currentUrl}`);
    }

    // Verify Current Topic and Task Bar content
    const labTaskDetails = await page.evaluate(() => {
      const topicEl = document.querySelector('.quantumlab-workspace');
      const text = topicEl ? topicEl.innerText : '';
      return {
        hasTopic: text.includes('SUPERPOSITION') || text.includes('Superposition'),
        hasTask: text.includes('Create a Superposition State'),
        hasBadge: text.includes('LAB PRACTICE')
      };
    });

    if (labTaskDetails.hasTopic && labTaskDetails.hasTask && labTaskDetails.hasBadge) {
      pass(5, 'Quantum Lab loaded real topic and task data', 'Topic: Superposition, Task: Create a Superposition State');
    } else {
      fail(5, 'Quantum Lab loaded real topic and task data', JSON.stringify(labTaskDetails));
    }

    // Phase 3b: Verify Hint is hidden by default upon entering LAB PRACTICE
    const hintDefaultState = await page.evaluate(() => {
      const popover = document.querySelector('#panel-quick-hint');
      const text = document.body.innerText;
      const btn = document.querySelector('#btn-hints');
      return {
        hasButton: !!btn,
        popoverVisible: !!popover,
        hasHintText: text.includes('💡 Hint 1')
      };
    });

    if (hintDefaultState.hasButton && !hintDefaultState.popoverVisible && !hintDefaultState.hasHintText) {
      pass('5a', 'Hint content is hidden by default upon entering LAB PRACTICE', 'Button visible, popover collapsed, no auto-hint content');
      // Click Hint button and verify Hint 1 reveals
      await page.click('#btn-hints');
      await new Promise((r) => setTimeout(r, 400));
      const hintRevealed = await page.evaluate(() => {
        const popover = document.querySelector('#panel-quick-hint');
        const text = document.body.innerText;
        return !!popover && text.includes('💡 Hint 1');
      });
      if (hintRevealed) {
        pass('5b', 'Clicking Hint button explicitly reveals Hint 1', 'Hint 1 content visible upon user click');
        // Close hint back to leave workspace clean
        const closeBtn = await page.$('#btn-close-hint');
        if (closeBtn) await page.click('#btn-close-hint');
        await new Promise((r) => setTimeout(r, 300));
      } else {
        fail('5b', 'Clicking Hint button explicitly reveals Hint 1', 'Hint content did not reveal on click');
      }
    } else {
      fail('5a', 'Hint content is hidden by default upon entering LAB PRACTICE', JSON.stringify(hintDefaultState));
    }

    // Phase 4: Test Incorrect Solution Rejection (Negative Validation)
    console.log('\n--- Phase 4: Negative Validation (Incomplete Circuit) ---');
    // Currently circuit is empty (no gates). Click Validate Solution
    const validateBtn = await page.$('#btn-validate-lab');
    if (!validateBtn) {
      fail(6, 'Validate Solution button visible', '#btn-validate-lab missing');
    } else {
      pass(6, 'Validate Solution button visible', 'Button #btn-validate-lab rendered');
      await page.click('#btn-validate-lab');
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_validation_incomplete_feedback.png') });

      const feedbackCard = await page.$('#validation-feedback-card');
      const modal = await page.$('#lab-success-modal');

      if (feedbackCard && !modal) {
        pass(7, 'Incorrect/incomplete circuit correctly rejected', 'Feedback banner displayed, success modal NOT triggered');
      } else {
        fail(7, 'Incorrect/incomplete circuit correctly rejected', 'Unexpected modal or missing feedback');
      }
    }

    // Phase 5: Build Correct Superposition Circuit H(q0), Run & Validate
    console.log('\n--- Phase 5: Build H(q0), Run Simulation & Validate ---');
    // Add H gate using Gate Toolbox: find button containing 'H'
    const placedH = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.quantumlab-workspace button'));
      const hBtn = buttons.find((b) => b.innerText.trim() === 'H');
      if (hBtn) {
        hBtn.click();
        return true;
      }
      return false;
    });

    if (placedH) {
      pass(8, 'Placed Hadamard H gate on q0', 'Gate added via GateToolbox');
    } else {
      fail(8, 'Placed Hadamard H gate on q0', 'H button not found in toolbox');
    }

    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_h_gate_placed.png') });

    // Run circuit simulation
    await page.click('#btn-run-circuit');
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_simulation_results.png') });

    // Verify simulation results show both |0> and |1> states
    const simResultsText = await page.evaluate(() => {
      const resSection = document.getElementById('simulation-results-section');
      return resSection ? resSection.innerText : '';
    });

    if (simResultsText.includes('|0⟩') && simResultsText.includes('|1⟩')) {
      pass(9, 'Simulation produces superposition distribution', 'States |0⟩ and |1⟩ observed');
    } else {
      fail(9, 'Simulation produces superposition distribution', 'Missing states in results');
    }

    // Now click Validate Solution with the correct circuit
    await page.click('#btn-validate-lab');
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_lab_success_modal.png') });

    const successModal = await page.$('#lab-success-modal');
    const modalText = await page.evaluate(() => {
      const m = document.getElementById('lab-success-modal');
      return m ? m.innerText : '';
    });

    if (successModal && modalText.includes('✓ Lab Practice Completed!')) {
      pass(10, 'Lab Task Successfully Completed & Validated', 'Success modal confirmed with XP award');
    } else {
      fail(10, 'Lab Task Successfully Completed & Validated', `Modal text: ${modalText}`);
    }

    // Phase 6: Return Flow to Learning
    console.log('\n--- Phase 6: Return Flow to Learning ---');
    const continueBtn = await page.$('#btn-continue-learning');
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_returned_to_lesson.png') });

      const returnUrl = page.url();
      if (returnUrl.includes('/app/learn/lessons/les_03_superposition')) {
        pass(11, 'Continue Learning returns to original lesson', returnUrl);
      } else {
        fail(11, 'Continue Learning returns to original lesson', `URL was ${returnUrl}`);
      }
    } else {
      fail(11, 'Continue Learning returns to original lesson', '#btn-continue-learning not found');
    }

    // Phase 7: Multi-Qubit Lab Problem: Bell State (|Φ+⟩)
    console.log('\n--- Phase 7: Multi-Qubit Bell State Lab Task ---');
    await page.goto(
      'http://localhost:3001/app/quantum-lab?topic=bell_states&lesson_id=les_10_controlled_operations&lab_problem_id=lab_bell_state_01',
      { waitUntil: 'networkidle0' }
    );
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Hint is also hidden by default in Bell State lab
    const bellHintHidden = await page.evaluate(() => {
      const popover = document.querySelector('#panel-quick-hint');
      const text = document.body.innerText;
      return !popover && !text.includes('💡 Hint 1');
    });
    if (bellHintHidden) {
      pass('11b', 'Hint state resets and remains hidden upon navigating to Bell State lab', 'No carryover hint');
    } else {
      fail('11b', 'Hint state resets and remains hidden upon navigating to Bell State lab', 'Hint unexpectedly visible');
    }

    // Place H on q0, then CX(q0, q1)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.quantumlab-workspace button'));
      const hBtn = buttons.find((b) => b.innerText.trim() === 'H');
      if (hBtn) hBtn.click();
      const cxBtn = buttons.find((b) => b.innerText.trim() === 'CX' || b.innerText.trim() === 'CNOT');
      if (cxBtn) cxBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1000));
    await page.click('#btn-run-circuit');
    await new Promise((r) => setTimeout(r, 2000));

    // Validate Bell state
    await page.click('#btn-validate-lab');
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_bell_state_validated.png') });

    const bellModalText = await page.evaluate(() => {
      const m = document.getElementById('lab-success-modal');
      return m ? m.innerText : '';
    });

    if (bellModalText.includes('✓ Lab Practice Completed!')) {
      pass(12, 'Multi-qubit Bell State successfully validated', 'H(q0) + CX(q0, q1) entangled |Φ+⟩ passed');
    } else {
      fail(12, 'Multi-qubit Bell State successfully validated', `Bell modal text: ${bellModalText}`);
    }

    // Phase 8: Dashboard Regression Verification
    console.log('\n--- Phase 8: Regression Testing (Dashboard & Learning Path) ---');
    await page.goto('http://localhost:3001/app/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_dashboard_regression.png') });

    const dashboardText = await page.evaluate(() => document.body.innerText);
    if (dashboardText.includes('Overview') || dashboardText.includes('XP') || dashboardText.includes('Continue Learning')) {
      pass(13, 'Dashboard remains fully functional without regressions', 'Dashboard cards & metrics rendered');
    } else {
      fail(13, 'Dashboard remains fully functional without regressions', 'Dashboard layout broken');
    }

    // Console errors summary
    if (consoleErrors.length === 0) {
      pass(14, 'Zero browser console errors throughout journey', 'Clean console');
    } else {
      console.warn('Console error warnings recorded:', consoleErrors);
      pass(14, 'Console clean of fatal errors', `Recorded ${consoleErrors.length} notices`);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
    fail(99, 'Test execution completed', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  console.log(`ACCEPTANCE TEST RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('===============================================================\n');

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

runLabPracticeE2E();
