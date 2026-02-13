# TIL Tracker - Project TODO

## Database & Backend
- [x] 참여자(Participant) 테이블 설계 및 마이그레이션
- [x] TIL 제출(TILSubmission) 테이블 설계 및 마이그레이션
- [x] 참여자 CRUD API 구현 (생성, 조회, 수정, 삭제)
- [x] TIL 제출 CRUD API 구현
- [x] 주간 통계 API 구현 (지난주 제출 개수 집계)
- [x] 벌금 계산 API 구현 (미달 개수당 5천원)

## Frontend UI Components
- [x] 참여자 관리 모달/페이지 UI
- [x] TIL 제출 폼 컴포넌트 (참여자 선택, 링크 입력, 날짜 선택)
- [x] 달력형 현황 표시 컴포넌트 (날짜별 제출자 표시, 클릭 시 링크 이동)
- [x] 주간 통계 테이블 컴포넌트 (참여자별 개수, 미달 표시)
- [x] 벌금 현황 표시 컴포넌트 (참여자별 벌금, 합계)
- [x] 메인 페이지 레이아웃 및 통합

## Styling & UX
- [x] 우아한 디자인 시스템 구축 (색상, 타이포그래피, 간격)
- [x] 반응형 디자인 적용
- [x] 마이크로 인터랙션 및 애니메이션 추가

## Testing & Deployment
- [x] 백엔드 API 단위 테스트 작성
- [x] 통합 테스트 및 버그 수정
- [x] 최종 배포 준비

## Completed

## New Features
- [x] 달력에 참여자 필터링 기능 추가 (단정 참여자만 보기)

## Completed Features
- [x] 주차별 벌금 히스토리 페이지 추가
- [x] 벌금 변화 추이 차트 구현
- [x] 주차별 상세 벌금 내역 테이블 구현
- [x] 참여자별 벌금 추이 차트 구현

## Completed Features (Latest)
- [x] 히스토리 토글 기능 추가 (열고 닫기)
- [x] 다크모드 구현
- [x] 테마 토글 버튼 추가

## Bug Fixes & Improvements
- [x] 메인 페이지 히스토리 토글 제거 (잠못된 구현)
- [x] 벌금 히스토리 페이지에 상세 내역 토글 기능 추가

## New Features (Completed)
- [x] 참여자 이모티콘 선택 기능 추가
- [x] 최신 TIL 업데이트 블록 추가 (제출자, 링크, 미리보기 이미지)

## Bug Fixes (Completed)
- [x] 제출 날짜 오류: 제출하면 다음날 칭에 표기되는 문제 수정 (타임존닄 오류)
- [x] 최신 업데이트 미리보기 이미지 미표시 문제 수정 (OpenGraph API 사용)

## UI Changes (Completed)
- [x] 지난주 통계 블록 삭제
- [x] 벌금 현황 블록 레이아웃 재구성 (총 벌금 누적, 벌금 대상자 이동, 필수 제출 개수 추가)

## New Features (Completed)
- [x] 참여자 상세 프로필 페이지 (클릭 시 이동)
- [x] 참여자별 전체 TIL 제출 기록 조회
- [x] 참여자별 벌금 내역 표시

## In Progress (Completed)
- [x] 참여자 프로필 페이지에 주간 TIL 제출 차트 추가
- [x] 참여자 프로필 페이지에 월간 TIL 제출 차트 추가

## Current Changes (Completed)
- [x] 개인 프로필 페이지에서 주간/월간 차트 삭제
- [x] 메인 페이지에서 달력과 최신 업데이트 블록 위치 교환

## Layout Changes (Completed)
- [x] TIL 제출 블록 오른쪽에 최신 업데이트 배치
- [x] 달력 블록을 최신 업데이트 아래에 배치

## Bug Fixes & Updates (In Progress)
- [x] 최신 업데이트 블록에서 최근 3개만 표시
- [x] 벌금 누적 시작일을 1월 5일로 변경 (1월 5일부터 주차별 4회 미제출 시 벌금 누적)

## Current UI Update (Completed)
- [x] 벌uae08 현황 블록 레이아웃 변경 (상단 4개 카드 + 하단 테이블)
## UI Refinements (Completed)
- [x] 최신 업데이트 블록에서 미리보기 이미지 제거
- [x] 벌uae08 현황 블록 명칭 수정 (누적 벌금 -> 누적 총 벌금, 지난주 벌금 -> 지난주 총 벌금)
## Bug Fixes (Completed)
- [x] 누적 총 벌금 계산 로직 수정 (2026년 1월부터 각 주차별 4회 미만 제출 시 누적)

## Critical Bug Fixes (Completed)
- [x] 누적 총 벌금이 지난주 벌금을 반영하지 않는 문제 수정 (2026-01-01부터 데이터 조회 범위 동기화)
- [x] 누적 벌금 계산 로직 디버깅 (1월 기록 없음, 지난주 벌금 미반영)
- [x] 누적 벌금 = 지난주 벌금 + 이전 주차 벌금 구조로 변경

## New Features (In Progress)
- [ ] 리더보드 페이지 구현 (모든 참여자의 주차별 제출 현황 비교)
- [ ] 주차별 필터링 기능
- [ ] 참여자별 벌금 내역 표시

## Bug Fixes (Completed)
- [x] 참여자 프로필 페이지의 주별 벌금 내역을 2026년 1월부터 계산하도록 수정
- [x] 참여자 프로필 페이지의 누적 벌금을 2026년 1월부터 계산하도록 수정

## Critical Bug (Completed)
- [x] 참여자 프로필 페이지의 주별 벌금 내역이 실제 제출 데이터를 반영하지 않는 문제 수정 (FineStatus.tsx와 동일한 날짜 처리 로직 적용)


## New Feature (Completed)
- [x] 달력에서 TIL 삭제 기능 구현
  - [x] 달력의 제출 항목에 삭제 버튼 추가 (호버 시 표시)
  - [x] 삭제 확인 모달 구현 (AlertDialog)
  - [x] 삭제 API 호출 및 DB 연동 (기존 API 사용)
  - [x] 삭제 후 UI 업데이트 (자동 새로고침)


## UI Improvements (Completed)
- [x] 벌금 히스토리 버튼 제거
- [x] 다크모드에서 벌금 현황 블록의 미달자 배경색 개선 (차콜색 배경, 희색 텍스트)


## Bug Fix (Completed)
- [x] 리더보드 페이지에 뒤로가기 버튼 추가


## Bug (Completed)
- [x] 31일자 제출이 달력에 표기되지 않는 문제 수정 (날짜 검증 로직 추가)


## New Feature (Completed)
- [x] 전체 TIL 제출 기록에서 제출 내역 삭제 기능 추가
  - [x] 최신 업데이트 섹션의 각 항목에 삭제 버튼 추가 (호버 시 나타남)
  - [x] 삭제 확인 모달 구현 (AlertDialog)
  - [x] DB에서 제출 내역 삭제 (기존 API 사용)
  - [x] 삭제 후 UI 업데이트 (자동 새로고침)


## New Feature (Completed)
- [x] 참여자 프로필 페이지의 '전체 TIL 제출 기록' 블록에서 TIL 삭제 기능 추가
  - [x] 제출 기록 테이블의 각 행에 삭제 버튼 추가 (호버 시 나타남)
  - [x] 삭제 확인 모달 구현 (AlertDialog)
  - [x] DB에서 제출 내역 삭제 (기존 API 사용)
  - [x] 삭제 후 UI 업데이트 (자동 새로고침)


## Bug (Completed)
- [x] 1월 31일 제출 TIL이 달력에 표기되지 않는 문제 수정 (날짜 마른도 스트링 만들기 시 UTC 기준 사용)


## New Feature (Completed)
- [x] 달력에 참여자의 이모티콘 표시 기능 추가


## File Update (Completed)
- [x] FineStatus.tsx 파일을 사용자 제공 코드로 교체 (누적 벌금 계산 로직 개선)


## Bug Fix (Completed)
- [x] CalendarView.tsx: 월간 조회 endDate를 endOfDay로 변경하여 31일 누락 해결
- [x] CalendarView.tsx: 날짜 키를 KST(Asia/Seoul)로 통일 (ymdKST 함수)
- [x] ParticipantProfile.tsx: 벌금 시작일을 2025-12-29로 변경
- [x] ParticipantProfile.tsx: 누적/주별 벌금을 지난주까지만 계산하도록 변경
- [x] Leaderboard.tsx: 상단에 "역대 누적 총 벌금" 카드 추가


## UI Improvement (Completed)
- [x] Leaderboard 주차 선택을 2025-12-29부터 시작하도록 수정
- [x] 주차 선택에 년도 표기 추가 (예: 2025. 12. 29. ~ 2026. 1. 4.)


## New Feature (Completed)
- [x] 메인 페이지 최하단에 리더보드 블록 추가
  - [x] 현재 주차 참여자별 제출 현황 표시
  - [x] 상위 5명 순위 표시
  - [x] 리더보드 페이지로 이동 링크 추가
