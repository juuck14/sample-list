---
name: sample-list-orchestrator
description: "YouTube 좋아요 샘플 매니저(백엔드 없는 React+Vite 정적 앱) 빌드 에이전트 팀을 조율하는 오케스트레이터. 앱 만들기/구현/스캐폴딩 초기 실행은 물론, 후속 작업(기능 추가, 화면 수정, 인증/API 수정, 코멘트 기능 보완, 다시 실행, 업데이트, 이전 결과 개선, 일부만 재구현, 배포 설정 변경) 요청 시에도 반드시 이 스킬을 사용. 좋아요/샘플/코멘트/유튜브 연동/배포 관련 작업이면 트리거."
---

# Sample List Orchestrator

백엔드 없이 동작하는 React+Vite YouTube 샘플 매니저를 에이전트 팀으로 빌드/유지보수하는 통합 스킬.

## 실행 모드: 에이전트 팀

데이터 레이어(API/localStorage)와 UI의 데이터 shape 합의가 품질의 핵심이라, 팀원 간 실시간 통신(SendMessage)과 경계면 교차검증이 필요하다. 단순 질문은 직접 응답 가능.

## 에이전트 구성

| 팀원 | 타입 | 역할 | 스킬 | 출력 |
|------|------|------|------|------|
| frontend-architect | Plan | 구조·스키마·배포 설계 | frontend-architecture | `_workspace/01_architect_design.md` |
| youtube-api-engineer | 커스텀 | OAuth PKCE + API + 데이터레이어 | youtube-api-integration | 소스 + `_workspace/02_api_contract.md` |
| react-ui-engineer | 커스텀 | React 화면/컴포넌트 | react-ui-build | 컴포넌트 소스 |
| frontend-qa | general-purpose | 경계면 정합성 + 빌드/배포 검증 | frontend-qa-check | `_workspace/03_qa_report.md` |

> 모든 Agent/TeamCreate 멤버는 `model: "opus"`.

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)
1. `_workspace/` 존재 여부 확인
2. 모드 결정:
   - **미존재** → 초기 빌드. Phase 1로
   - **존재 + 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출, 기존 산출물 중 대상만 갱신. 이전 산출물 경로를 프롬프트에 포함
   - **존재 + 새 입력/재시작** → 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1

### Phase 1: 준비
1. 사용자 요구사항 + `README.md` 분석
2. `_workspace/` 생성 (또는 새 실행 시 이전 것 보관 이동 후 재생성)

### Phase 2: 팀 구성
1. `TeamCreate(team_name: "sample-list-team", members: [4명, 각 model: "opus", 위 역할 prompt])`
2. `TaskCreate`로 작업 등록 (depends_on으로 순서 표현):
   - 설계 (architect)
   - 인증+API+데이터레이어 (api-engineer) — depends_on 설계
   - 화면 구현 (ui-engineer) — depends_on api_contract
   - 점진 정합성 검증 (qa) — 각 모듈 완성 직후 반복

### Phase 3: 빌드 (팀원 자체 조율)
**파이프라인 + 생성-검증 복합.**
- architect가 스키마 확정 → api-engineer·ui-engineer 양쪽에 SendMessage
- api-engineer가 함수 시그니처 확정 → ui-engineer에 `02_api_contract.md` 통보
- ui-engineer는 계약대로 소비, 불일치는 추측 말고 api-engineer에 확인
- **frontend-qa는 각 모듈 완성 직후 경계면 교차검증** (양쪽 동시 읽기), 이슈는 생산자·소비자 양쪽에 알림
- 리더는 TaskGet으로 모니터링, 막힌 팀원 지원

### Phase 4: 통합 검증
1. 전 팀원 완료 대기
2. `npm install && npm run build` 성공 확인
3. `03_qa_report.md` 검토 — 실패 항목 잔존 시 해당 에이전트 재작업
4. 배포 설정(Vite base, OAuth origin) 최종 확인

### Phase 5: 정리
1. 팀원 종료 (SendMessage) → `TeamDelete`
2. `_workspace/` 보존
3. 사용자에게 요약 보고 + 실행/배포 다음 단계 안내 + 피드백 요청

## 데이터 흐름
```
[리더] → TeamCreate
architect ─(스키마)→ api-engineer ─(02_api_contract)→ ui-engineer
              │            │                  │
        01_design.md   소스코드           컴포넌트
              └──────── frontend-qa 교차검증 ────────┘
                              ↓
                       03_qa_report.md → 리더 통합
```

## 에러 핸들링
| 상황 | 전략 |
|------|------|
| 팀원 1명 실패 | 리더 감지 → SendMessage 확인 → 재시작 또는 대체 |
| 스키마 충돌 | 삭제 말고 architect가 변경 이력 남기고 양쪽 재통보 |
| 계약 불일치 발견 | qa가 양쪽에 수정 요청, 캐스팅 우회 금지 |
| 빌드 실패 | 에러를 해당 에이전트에 전달해 수정, 통과 전까지 미완료 |
| 타임아웃 | 부분 결과 사용, 미완료 항목 보고서에 명시 |

## 테스트 시나리오

### 정상 흐름
1. "샘플 매니저 앱 만들어줘" → Phase 1 분석
2. 팀 구성(4명) + 작업 등록
3. architect 스키마 확정 → api-engineer 데이터레이어 → ui-engineer 화면
4. qa가 각 모듈 직후 경계면 검증, 빌드 성공
5. `_workspace/`에 설계/계약/QA리포트 + 동작하는 소스 생성

### 에러 흐름
1. ui-engineer가 `samples`를 배열로 기대했으나 store가 `{samples:[]}` 반환
2. frontend-qa가 양쪽 동시 읽기로 불일치 감지
3. api-engineer·ui-engineer 양쪽에 파일:라인 + 수정 방법 전달
4. 수정 후 재검증 → 통과
5. 리포트에 해당 이슈와 해결 기록
