# 커피 주문 및 재고 관리 시스템 (Coffee Order App)

Next.js 기반의 커피 주문 및 재고 관리 웹 애플리케이션입니다. 고객에게는 직관적이고 빠른 주문 경험을, 매장 관리자에게는 실시간 주문 처리 및 효율적인 재고 관리 환경을 제공합니다.

## 주요 기능

### 👩‍💻 사용자 (고객) 기능
- **메뉴 조회 및 필터링**: 카테고리별(Coffee, Non-Coffee, Dessert 등) 메뉴 조회
- **상세 옵션 선택**: 온도, 샷 추가, 시럽 등 세부 옵션 선택 및 동적 가격 계산
- **장바구니 및 결제**: 멱등성 키(Idempotency Key)를 활용한 중복 결제 방지
- **실시간 주문 상태 조회**: 주문 대기부터 픽업 완료까지의 과정을 실시간(SSE/Polling)으로 확인

### 👨‍💼 관리자 기능
- **실시간 주문 대시보드**: Supabase Realtime을 활용하여 새로고침 없이 신규 주문 수신
- **주문 상태 관리**: 주문 접수, 제조 완료, 픽업 완료, 주문 취소 상태 변경
- **재고 및 매장 관리**: 메뉴별 재고 수량 수정, 품절 처리 및 매장 영업 상태(OPEN/PAUSE/CLOSE) 제어
- **메뉴 관리**: 메뉴 및 옵션(추가 금액 등) 등록, 수정, 삭제

## 기술 스택

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Database & Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel

## 🗄️ 데이터베이스 스키마 (Database Schema)

이 프로젝트는 Supabase (PostgreSQL)를 백엔드로 사용하며, 스키마 정의 및 초기 데이터 마이그레이션 파일은 `supabase/migrations/0001_initial_schema.sql`에 위치해 있습니다.

### 1. 주요 테이블 구조

* **`users`**: 회원 및 관리자 계정 정보 (`id`, `email`, `oauth_provider`, `role`: `GUEST`/`USER`/`ADMIN`)
* **`store_settings`**: 매장 영업 상태 관리 (`id`, `status`: `OPEN`/`PAUSE`/`CLOSE`, `updated_at`)
* **`menus`**: 판매 메뉴 정보 (`id`, `name`, `category`, `price`, `stock_quantity`, `is_sold_out`, `image_url`)
* **`menu_options`**: 메뉴별 추가 옵션 (`id`, `menu_id` [FK -> `menus.id` CASCADE], `option_name`, `extra_price`)
* **`orders`**: 주문 정보 (`id`, `user_id` [FK -> `users.id` Nullable], `guest_name`, `idempotency_key` [UNIQUE], `total_price`, `status`: `접수대기`/`제조중`/`픽업완료`/`취소됨`)
* **`order_items`**: 주문 상세 내역 (`id`, `order_id` [FK -> `orders.id` CASCADE], `menu_id` [FK -> `menus.id` RESTRICT], `quantity`, `unit_price`, `selected_option_ids` [JSONB])

### 2. ERD 관계 구조

```
[users] 1 --- (0..N) ---> [orders] (1) --- (1..N) ---> [order_items]
                            |                              |
                            |                              v (ON DELETE RESTRICT)
                            +-------------------------> [menus] (1) --- (0..N) ---> [menu_options]
                                                                       (ON DELETE CASCADE)
```

### 3. 스키마 주요 특징

* **실시간 주문 및 매장 관리 (Supabase Realtime)**: `orders` 및 `store_settings` 테이블에 Supabase Realtime publication이 적용되어 대시보드 및 사용자 화면에서 새로고침 없이 실시간 데이터 수신 가능
* **중복 주문 방지 (Idempotency Key)**: `orders.idempotency_key` 컬럼에 UNIQUE 제약 조건을 설정하여 재시도 시 중복 생성 차단
* **비회원 손님 주문 지원**: `orders.user_id`를 Nullable로 두고 `guest_name`을 저장하여 비회원 픽업 주문 완벽 지원
* **데이터 무결성 보호**: 메뉴 삭제 시 과거 주문 기록 보존을 위해 `order_items.menu_id`에 `ON DELETE RESTRICT` 설정
* **유연한 옵션 저장**: `order_items.selected_option_ids`에 JSONB 타입 구조를 채택하여 복잡한 M:N 조인 테이블 없이 다중 옵션 손쉽게 저장 및 조회

## 시작하기 (Getting Started)

이 프로젝트는 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)으로 부트스트랩되었습니다.

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase 등 필요한 환경 변수를 설정합니다.

### 2. 개발 서버 실행
다음 명령어를 통해 로컬 개발 서버를 실행할 수 있습니다:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

개발 서버가 실행되면 다음 경로를 통해 서비스에 접속할 수 있습니다:

- **고객 주문 페이지**: [http://localhost:3000](http://localhost:3000)
- **관리자 대시보드 (주문 관리)**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
- **관리자 메뉴 관리**: [http://localhost:3000/admin/menus](http://localhost:3000/admin/menus) (로그인 필요)

### 📱 모바일/태블릿 접속 (같은 Wi-Fi 환경)

스마트폰이나 태블릿 등 다른 기기에서 고객 주문 페이지 등을 확인하려면, PC와 같은 Wi-Fi 네트워크에 연결한 뒤 모바일 브라우저 주소창에 아래의 내부 IP 주소를 입력하여 접속하세요:

- **모바일 진입 URL**: [http://192.168.7.210:3000](http://192.168.7.210:3000)

### 3. 관리자 계정(ID/PW) 설정 방법

관리자 메뉴 관리에 접근하기 위해서는 Supabase Auth를 통한 로그인이 필요합니다. 관리자 계정은 다음과 같은 방법으로 설정할 수 있습니다.

**방법 A: Supabase 대시보드에서 직접 생성 (권장)**
1. 연결된 [Supabase 프로젝트 대시보드](https://supabase.com/dashboard)에 접속합니다.
2. 좌측 메뉴에서 **Authentication** > **Users** 탭으로 이동합니다.
3. 우측 상단의 **Add user** > **Create new user** 버튼을 클릭합니다.
4. 관리자로 사용할 **이메일(ID)**과 **비밀번호(PW)**를 입력하고 `Create user`를 눌러 계정을 생성합니다.
5. (선택) 만약 Email Confirm 기능이 켜져 있다면, 해당 유저를 선택하여 이메일 인증 처리를 완료해 주어야 합니다. (MVP 단계에서는 기본적으로 이메일 인증 없이 바로 로그인 가능하도록 Authentication > Providers > Email 설정에서 'Confirm email'을 해제하는 것이 편리합니다.)

**방법 B: 로컬 더미 계정 사용**
현재 로컬 개발 환경 테스트를 위해 임시로 아래 계정이 생성되어 있을 수 있습니다. (직접 생성 스크립트를 실행한 경우)
- **ID**: `admin@admin.com`
- **PW**: `admin1234`
