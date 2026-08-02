# [PRD] 커피 주문 및 재고 관리 웹 애플리케이션 (v2.0)

---

## 1. 프로젝트 개요 (Overview)

* **제품명**: 커피 주문 및 재고 관리 시스템
* **목적**: 손님에게는 직관적이고 빠른 음료 주문 경험을 제공하고, 매장 관리자에게는 실시간 주문 처리 및 정확한 재고 관리 환경을 제공하기 위함.
* **권장 기술 스택**: Next.js, Supabase, Tailwind CSS, shadcn/ui

---

## 2. 타깃 유저 및 유스케이스

| 구분 | 주요 사용자 | 핵심 목표 |
| --- | --- | --- |
| **사용자 (Customer)** | 매장 방문 손님 / 비회원 고객 | 가입 허들 없이(소셜/비회원) 메뉴 확인, 장바구니 담기, 안전한 결제 완료 |
| **관리자 (Admin)** | 매장 매니저 / 카페 운영자 | 실시간 주문 수신, 결제 취소 및 환불 관리, 영업 상태/재고 실시간 제어 |

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 사용자 (Customer) 화면

* **F-1.1 메뉴 목록 조회**
  * 카테고리별 필터링 기능.
  * 매장 영업 종료(CLOSE) 시 전체 주문 불가 안내 UI 노출.
  * 재고 `0`이거나 품절 상태 메뉴는 `품절(Sold Out)` 처리.
* **F-1.2 메뉴 상세 및 옵션 선택**
  * 온도, 수량 조절 기능.
  * DB에 사전 정의된 `MenuOptions` 데이터를 기반으로 추가 옵션(샷, 시럽 등) 제공 및 동적 가격 계산.
* **F-1.3 주문 및 결제 (중복 방지)**
  * 장바구니 총 결제 금액 계산.
  * 멱등성 키(Idempotency Key)를 발급하여, 네트워크 지연 시 중복 결제 및 중복 주문이 발생하지 않도록 처리.
* **F-1.4 주문 상태 확인 및 알림**
  * 주문 완료 시 고유 주문 번호 발급.
  * 커넥션 최적화를 위해 SSE 또는 주기적 Polling으로 진행 상태(`접수대기` ➔ `제조중` ➔ `픽업완료`) 조회.
  * '제조 완료' 및 '픽업 완료' 단계에서 카카오 알림톡 또는 Web Push 알림 발송.

### 3.2 관리자 (Admin) 화면

* **F-2.1 매장 영업 상태 관리 (New)**
  * 관리자 대시보드에서 매장 상태(영업 중, 주문 일시 정지, 마감) 토글 스위치 적용.
* **F-2.2 실시간 주문 관리 대시보드**
  * 새로고침 없이 신규 주문 발생 시 실시간 알림 (Supabase Realtime 활용).
  * 버튼 클릭으로 주문 상태 변경.
  * 주문 취소 시 결제 취소(PG사 API 호출)와 재고 복원 트랜잭션을 동시에 처리.
* **F-2.3 메뉴 및 마스터 옵션 관리**
  * 메뉴 및 연결된 옵션(이름, 추가 금액) CRUD 기능.
  * 수동 `품절` 토글 기능.

---

## 4. 데이터 모델 요구사항 (Data Schema Outline)

```text
[Users] (사용자/관리자)
  - id (PK)
  - email / oauth_provider (카카오, 네이버 등)
  - role ('GUEST' | 'USER' | 'ADMIN')

[StoreSettings] (매장 운영 정보)
  - id (PK)
  - status ('OPEN' | 'PAUSE' | 'CLOSE')

[Menus] (메뉴 목록)
  - id (PK)
  - name, category, price, stock_quantity, is_sold_out, image_url

[MenuOptions] (메뉴 부가 옵션 마스터 테이블)
  - id (PK)
  - menu_id (FK -> Menus.id)
  - option_name (예: 샷 추가, 디카페인 변경)
  - extra_price

[Orders] (주문 헤더)
  - id (PK)
  - user_id (FK -> Users.id, 비회원 허용 시 null 또는 guest_id)
  - idempotency_key (중복 결제 방지용 고유키)
  - total_price, status, created_at

[OrderItems] (주문 상세)
  - id (PK)
  - order_id (FK -> Orders.id)
  - menu_id (FK -> Menus.id)
  - quantity, unit_price
  - selected_option_ids (JSON Array - MenuOptions의 ID 참조)