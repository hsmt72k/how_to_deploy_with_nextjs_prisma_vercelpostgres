## Next.js + Prisma + Vercel Postgres を使ったアプリの作成手順（デプロイまで）

Prisma は、Node.js および TypeScript アプリケーションでデータベースにアクセスするために使用できる
次世代 ORM である。
この手順では、以下のツールを使ってサンプルアプリを作成していく。

|ツール |役割 |
|:-- |:-- |
|Next.js |React フレームワーク |
|Next.js API Routes |バックエンドとしてのサーバ側 API ルート |
|Prisma |マイグレーションを含む DB アクセスのための ORM フレームワーク |
|Vercel Postgres |PostgreSQL データベース |
|NextAuth.js |Google（OAuth）経由の認証用 |
|TypeScript |プログラミング言語 |
|Vercel |デプロイ先サーバ |

### もくじ

- Step.01: Next.js スターター プロジェクトをセットアップする
- Step.02: Prismaをセットアップし､PostgreSQLデータベースにアクセスする
- Step.03: Prisma をセットアップし、データベース スキーマを作成する
- Step.04: Prisma クライアントをインストールして生成する
- Step.05: データベースからデータを読み込むために、既存のビューを更新する
- 


### 前提条件

この手順を行うには、以下のものが必要になる。

- Node.js
- Vercel アカウント（PostgreSQL のセットアップ、アプリデプロイのため）
- Google アカウント（OAuth アプリを作成するため）

### Step.01: Next.js スターター プロジェクトをセットアップする

任意のディレクトリに移動して、ターミナルで次のコマンドを実行し、新しい Next.js プロジェクトをセットアップする。

Next.js + Prisma のスタータープロジェクトを作成:  
``` console
npx create-next-app --example https://github.com/prisma/blogr-nextjs-prisma/tree/main blogr-nextjs-prisma
```

ディレクトリに移動してアプリを起動する。

プロジェクトのディレクトリに移動してアプリを起動:  
``` console
cd blogr-nextjs-prisma && npm run dev
```

ブラウザで http://localhost:3000 にアクセスして、Next.js アプリを確認する。

![アプリケーションの現在の状態](./captures/01_current_state_of_the_application.png)

このアプリには現在、'index.ts' ファイルの 'getStaticProps' から返されるハードコードされたデータが表示されている。
この後のセクションでは、実際のデータベースからデータが返されるように、これを変更する。

### Step.02: Prismaをセットアップし､PostgreSQLデータベースにアクセスする

この手順では、Vercel でホストされている無料の Postgres データベースを使用する。
まず、Step.01 でクローンしたソースコードを新規作成した GitHub リポジトリにプッシュし、
Vercel にデプロイして Vercel プロジェクトを作成する。

![新しい Vercel プロジェクト](./captures/02_new_vercel_project.png)

Vercel プロジェクトを作成したら、[Storage] タブをクリックする。データベースの中から、
Postgresの [Create]ボタンをクリックする。
Connect a Database モーダルが開いたら、「Postgres」のラジオボタンを選択し 、
「Continue」ボタンをクリックする。

[ストレージ] タブを選択:  
![[ストレージ] タブを選択](./captures/03_select_storage_tab.png)

Postgresの [Create]ボタンをクリック:  
![Postgresの [Create]ボタンをクリック](./captures/04_click_create_button_of_postgres.png)

「Postgres」のラジオボタンを選択し 、「Continue」ボタンをクリック:  
![「Postgres」のラジオボタンを選択し 、「Continue」ボタンをクリック](./captures/05_push_radio_button_of_postgres_and_submit_continue_button.png)

Vercel Postgers がベータ版でリスクがあることを理解して、「Accept」ボタンをクリックする。

「Accept」ボタンをクリック:  
![「Accept」ボタンをクリック](./captures/06_accept_vercel_postgres_beta.png)

新しいデータベースを作成するには、開いたダイアログで次の手順を実行する。

1. [Database Name] に「sample_postgres_db」(またはその他の任意の名前)を入力する。
名前には英数字、「_」、「-」のみを含めることができ、32 文字を超えることはできない。

2. [Region] で地域を選択する。現時点（2023/08/12）では、「Washington, D.C., USA - (iad1)」を選択する。
これ以外の地域を選択すると、「Serverless Functionsとデータ間のレイテンシが増加します」との警告が表示されるためだ。

データベース名と地域を入力して「Create & Continue」ボタンをクリック:  
![データベース名と地域を入力して「Create & Continue」ボタンをクリック](./captures/07_select_databese_name_and_region_and_submit_button.png)

どこの環境で利用できるようにしたいか問われるので、特に支障がなければ、

環境を選択して「Connect」ボタンをクリック:
![環境を選択して「Connect」ボタンをクリック](./captures/08_submit_connect_button.png)

ローカルに Vercel CLI を導入していない場合は、以下のコマンドで Vercel CLI をインストールする。

Vercel CLI をインストール:  
``` console
npm i -g vercel@latest
```

Vercel CLI がインストールされたことの確認:  
``` console
vercel --version
```

確認結果:  
```
Vercel CLI 31.2.3
```

最新の環境変数をプルダウンして、ローカル プロジェクトが Postgres データベースで動作するようにする。

必要なすべての環境変数を Vercel プロジェクトからローカルにプルダウン:  
``` console
vercel env pull .env.local
```

実行結果:  
```
Vercel CLI 31.2.3
> > No existing credentials found. Please log in:
? Log in to Vercel github
> Success! GitHub authentication complete for hsmt72k@gmail.com
Error: Your codebase isn’t linked to a project on Vercel. Run `vercel link` to begin.
```

「Error: Your codebase isn’t linked to a project on Vercel. Run `vercel link` to begin.」の
エラーが発生した場合は、ローカル環境と Vercel プロジェクトの紐付けが済んでいないので、
先に以下のコマンドを実行する。

ローカル環境と Vercel プロジェクトの紐付け:  
``` console
vercel link
```

実行結果:  
```
Vercel CLI 31.2.3
? Set up “~\Desktop\github.hsmt72k\how_to_deploy_with_nextjs_prisma_vercelpostgres”? [Y/n] y
? Which scope should contain your project? hsmt72k
? Found project “hsmt72k/how-to-deploy-with-nextjs-prisma-vercelpostgres”. Link to it? [Y/n] y
✅  Linked to hsmt72k/how-to-deploy-with-nextjs-prisma-vercelpostgres (created .vercel and added it to .gitignore)
```

再度 `vercel env pull .env.local` を実行した結果: 
```
Vercel CLI 31.2.3
> Downloading `development` Environment Variables for Project how-to-deploy-with-nextjs-prisma-vercelpostgres
✅  Created .env.local file and added it to .gitignore 
```

ローカルのプロジェクト内に作成された `.env.local` ファイルを開いて、環境変数の内容を確認する。

これで Vercel Postgres データベースの準備が完了し、
それをローカルおよび Vercel 上で実行するための環境変数がすべて揃った。

### Step.03: Prisma をセットアップし、データベース スキーマを作成する

次に、Prisma をセットアップし、PostgreSQL データベースに接続する。
まず、npm 経由で Prisma CLI をインストールする。

Prisma CLI をインストール:  
``` console
npm install prisma --save-dev
```

次に、Prisma CLIを使用してデータベースにテーブルを作成する。

これを行うには、prisma フォルダを作成し、schema.prisma というファイルを追加して、
データベース・スキーマを含むメインの Prisma 構成ファイルにする。

schema.prisma に以下のモデル定義をコーディングする。

prisma/schema.prisma:  
``` prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}

datasource db {
  provider = "postgresql"
  url = env("POSTGRES_PRISMA_URL") // uses connection pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // uses a direct connection
}

model Post {
  id        String     @default(cuid()) @id
  title     String
  content   String?
  published Boolean @default(false)
  author    User?   @relation(fields: [authorId], references: [id])
  authorId  String?
}

model User {
  id            String       @default(cuid()) @id
  name          String?
  email         String?   @unique
  createdAt     DateTime  @default(now()) @map(name: "created_at")
  updatedAt     DateTime  @updatedAt @map(name: "updated_at")
  posts         Post[]
  @@map(name: "users")
}
```

> 注意: ときどき `@map` や `@@map` を使って、フィールド名やモデル名をデータベースの
異なるカラム名やテーブル名にマップすることがある。
これは、NextAuth.js が、データベース内の特定のものを特定の方法で呼び出すために、
特別な要求をしているからである。

この Prisma スキーマは2つのモデルを定義し、
それぞれが基礎となるデータベースのテーブルにマッピングされる（User と Post）。
2つのモデルの間には、Post の author フィールドと User の posts フィールドを介した関係（一対多）
もあることに注意する。

実際にデータベースにテーブルを作成するには、環境変数が読み込めるように `.env.local` を `.env` に
リネームした上で、Prisma CLI の以下のコマンドを実行する。

Prisma スキーマに基づいてデータベースにテーブルを作成:  
``` console
npx prisma db push
```

実行結果:  
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "verceldb", schema "public" at "ep-fancy-truth-23617763.us-east-1.postgres.vercel-storage.com"

Your database is now in sync with your Prisma schema. Done in 6.66s

Running generate... (Use --skip-generate to skip the generators)
warn Preview feature "jsonProtocol" is deprecated. The functionality can be used without specifying it as a preview feature.

added 2 packages, and audited 98 packages in 3s

52 packages are looking for funding
  run `npm fund` for details

1 moderate severity vulnerability

To address all issues, run:
  npm audit fix --force

Run `npm audit` for details.

✔ Generated Prisma Client (5.1.1 | library) to .\node_modules\@prisma\client in 48ms
```

Vercel の Storage で、以下の Query を実行してみると、users と Post テーブルができていることが分かる。

Vercel で Query を実行:  
![Vercel で Query を実行](./captures/09_run_query_on_vercel_storage.png)

テーブルが作成されていることが確認できたら、Prisma Studio を使用して、初期ダミーデータを追加していく。

Prisma Studio をポート番号 7777 で起動:  
``` console
npx prisma studio --port 7777
```

Prisma Studio のインターフェイスを使用して、新しいユーザーレコードとポストレコードを作成し、
それらの関係フィールドを介して接続する。

新規 User レコードを作成:  
![新規 User レコードを作成](./captures/10_create_a_new_user_record.png)

User に紐づけて新規 Post レコードを作成:  
![User に紐づけて新規 Post レコードを作成](./captures/11_create_new_post_record_and_connect_it_to_the_user_record.png)

### Step.04: Prisma クライアントをインストールして生成する

Prisma を使用して Next.js からデータベースにアクセスするには、
まずアプリに Prisma クライアントをインストールする必要がある。


Prisma クライアント パッケージをインストール:  
``` console
npm install @prisma/client
```

Prisma Client はスキーマに合わせて調整されるため 、Prisma スキーマファイル（schema.prisma）が変更されるたびに、
次のコマンドを実行して更新する必要がある。

Prismaスキーマを再生成:  
``` console
npx prisma generate
```

1つの PrismaClient インスタンスを使用し、必要なファイルにインポートできる。
インスタンスは、lib/ディレクトリ内の prisma.ts ファイルに作成される。
そのためにまずは、ディレクトリとファイルを作成する必要がある。

Prisma ライブラリ用の新しいフォルダとファイルを作成:  
``` console
mkdir lib && touch lib/prisma.ts
```

Prisma Client に接続するために、prisma.ts ファイルに以下のコードを記述する。

lib/prisma.ts:
``` ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
```

これで、データベースへのアクセスが必要なときはいつでも、
必要なファイルに Prisma インスタンスをインポートできる。

### Step.05: データベースからデータを読み込むために、既存のビューを更新する

現状、pages/index.tsx に実装されているブログ記事フィードと pages/p/[id].tsx の記事詳細ビューは、
ハードコードされたデータを返している。
このステップでは、Prisma Client を使用してデータベースからデータを返すように実装を変更する。

pages/index.tsx を開き、まずは既存の import 宣言のすぐ下に以下のコードを追加する。

pages/index.tsx:  
``` tsx
import prisma from '../lib/prisma';
```

Prisma インスタンスは、データベースにデータを読み書きする際のインターフェイスとなりる。
たとえば、`prisma.user.create()` を呼び出して新しい User レコードを作成したり、
`prisma.post.findMany()` を呼び出してデータベースからすべての Post レコードを取得したりすることができる。
Prisma Client API の概要は、Prisma ドキュメントを参照する。

CRUD - Prisma Client | Prisma Documentation  
https://www.prisma.io/docs/concepts/components/prisma-client/crud

これで、index.tsx 内の `getStaticProps` にハードコードされた feed オブジェクトを、
データベースへの適切な呼び出しに置き換えることができる。

pages/index.tsx:  
``` tsx
export const getStaticProps: GetStaticProps = async () => {
  const feed = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true },
      },
    },
  });
  return {
    props: { feed },
    revalidate: 10,
  };
};
```

Prisma Client クエリのポイントは、以下の2点である。

- where フィルターは、published が true の Post レコードのみを含むように指定している
- Post レコードの作者名も照会され、返されるオブジェクトに含まれる

アプリを実行する前に、`/pages/p/[id].tsx` に移動し、
データベースから正しい Post レコードを読み込むように実装を修正する。

このページでは、`getStaticProps（SSG）` の代わりに `getServerSideProps（SSR）` を使用している。
これはデータが動的で、URL でリクエストされた Post の id に依存するからである。
例えば、`/p/42` のビューは、id が 42 の Post を表示することになる。

前と同じように、まず Prisma Client をページにインポートする必要がある。

pages/p/[id].tsx:  
``` tsx
import prisma from '../../lib/prisma';
```

これで `getServerSideProps` の実装を変更して、データベースから適切な post を取得し、
コンポーネントの props を通してフロントエンドで利用できる。

pages/p/[id].tsx:  
``` tsx
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  // ID にひもづく投稿を取得
  const post = await prisma.post.findUnique({
    where: {
      id: String(params?.id),
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  });
  return {
    props: post,
  };
};
```

これで完了。アプリが起動しなくなった場合は、以下のコマンドで再起動できる。

アプリを起動:  
``` console
npm run dev
```

起動していれば、ファイルを保存し、ブラウザから http://localhost:3000 にアクセスしてアプリを開く。
Post のレコードが以下のように表示される。

データベースに登録されている Post が表示される:  
![データベースに登録されている Post が表示される](./captures/12_display_published_post_from_database.png)

`pages/p/[id].tsx` も修正したので、post をクリックして詳細表示に移動することもできる。

詳細表示に移動:  
![詳細表示に移動](./captures/13_detail_post.png)

### Step.06: NextAuth で GitHub 認証を設定する

このステップでは、アプリに GitHub 認証機能を追加する。
この機能が使えるようになったら、認証されたユーザーが UI から投稿を作成・公開・削除できるようにする。

最初のステップとして、NextAuth.js ライブラリをアプリにインストールする。

NextAuth ライブラリと NextAuth Prisma アダプタをインストール:  
``` console
npm install next-auth@4 @next-auth/prisma-adapter
```

次に、データベースのスキーマを変更して、NextAuth が必要とするテーブルを追加する。

データベースのスキーマを変更するには、手動で Prisma スキーマに変更を加え、
`prisma db push` コマンドを再度実行する必要がある。

まずは、`prisma/schema.prisma` を開き、その中のモデルを次のように変更する。

prisma/schema.prisma:  
``` prisma
model Post {
  id        String  @id @default(cuid())
  title     String
  content   String?
  published Boolean @default(false)
  author    User?@relation(fields:[authorId], references:[id])
  authorId  String?}

model Account {
  id                 String  @id @default(cuid())
  userId             String  @map("user_id")
  type               String
  provider           String
  providerAccountId  String  @map("provider_account_id")
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?
  oauth_token_secret String?
  oauth_token        String?

  user User @relation(fields:[userId], references:[id], onDelete: Cascade)

  @@unique([provider, providerAccountId])}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique@map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields:[userId], references:[id], onDelete: Cascade)}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?@unique
  emailVerified DateTime?
  image         String?
  posts         Post[]
  accounts      Account[]
  sessions      Session[]}

model VerificationToken {
  id         Int      @id @default(autoincrement())
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])}
}
```




