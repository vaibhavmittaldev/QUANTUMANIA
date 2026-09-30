import urllib.request
import json
import sys

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def post_json(endpoint, data, token=None):
    req = urllib.request.Request(
        BASE_URL + endpoint,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_json(endpoint, token=None):
    req = urllib.request.Request(BASE_URL + endpoint)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("--- Phase 2 End-to-End Live Server Verification ---")
    user_payload = {
        'username': 'phase2_tester',
        'email': 'phase2_tester@quantumania.io',
        'password': 'Password123!',
        'display_name': 'Quantum Explorer'
    }

    # 1. Register or login
    try:
        res = post_json('/auth/register', user_payload)
        token = res['data']['token']
        print("[OK] 1. Registered new user and acquired access token.")
    except Exception:
        res = post_json('/auth/login', {'email': user_payload['email'], 'password': user_payload['password']})
        token = res['data']['token']
        print("[OK] 1. Logged into existing user and acquired access token.")

    # 2. Verify Courses endpoint
    courses = get_json('/courses', token)['data']
    assert len(courses) >= 1, "Expected at least 1 course"
    course_id = courses[0]['id']
    print(f"[OK] 2. Verified Courses: found {len(courses)} course(s), ID: {course_id}")

    # 3. Verify Course Detail & 5 Modules
    course_detail = get_json(f'/courses/{course_id}', token)['data']
    assert len(course_detail['modules']) == 5, f"Expected 5 modules, got {len(course_detail['modules'])}"
    print(f"[OK] 3. Verified Course Details: {len(course_detail['modules'])} modules present.")

    # 4. Verify Lessons in Module 1
    m1 = get_json('/modules/mod_foundations', token)['data']
    assert len(m1['lessons']) == 4, f"Expected 4 lessons in module 1, got {len(m1['lessons'])}"
    print(f"[OK] 4. Verified Module 1: {len(m1['lessons'])} lessons.")

    # 5. Check Initial Progress
    prog_init = get_json('/learning/progress', token)['data']
    initial_completed = prog_init['completed_lessons_count']
    print(f"[OK] 5. Progress before test run: completed={initial_completed}/20 ({prog_init['course_progress_percent']}%)")

    # 6. Complete Lesson 1
    c1 = post_json('/lessons/les_01_what_is_qc/complete', {}, token)['data']
    assert c1['is_completed'] is True
    print(f"[OK] 6. Completed Lesson 1: XP awarded={c1['xp_awarded']}, Next={c1['next_lesson_id']}")

    # 7. Complete Lesson 2
    c2 = post_json('/lessons/les_02_bits_vs_qubits/complete', {}, token)['data']
    assert c2['is_completed'] is True
    print(f"[OK] 7. Completed Lesson 2: XP awarded={c2['xp_awarded']}, Next={c2['next_lesson_id']}")

    # 8. Check Progress After Completions
    prog_after = get_json('/learning/progress', token)['data']
    assert prog_after['completed_lessons_count'] >= 2
    assert prog_after['recent_incomplete_lesson']['lesson_id'] == 'les_03_superposition'
    print(f"[OK] 8. Progress updated: {prog_after['completed_lessons_count']}/20 lessons ({prog_after['course_progress_percent']}%), Next Resume Lesson: {prog_after['recent_incomplete_lesson']['title']}")

    # 9. Test Re-login / Persistence
    re_login = post_json('/auth/login', {'email': user_payload['email'], 'password': user_payload['password']})
    token2 = re_login['data']['token']
    prog_re = get_json('/learning/progress', token2)['data']
    assert prog_re['completed_lessons_count'] == prog_after['completed_lessons_count']
    assert prog_re['recent_incomplete_lesson']['lesson_id'] == 'les_03_superposition'
    print(f"[OK] 9. Re-login persistence verified! Database stored progress is 100% resilient.")

    print("\n>>> ALL PHASE 2 LIVE API & PROGRESS CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    main()
