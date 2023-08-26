import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getProviders, signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { useRouter } from "next/router";

import Layout from '../../components/Layout';
import { authOptions } from "../../pages/api/auth/[...nextauth]";

export default function SignIn({ providers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { error } = useRouter().query;
  return (
    <Layout>
    <div className="continue-with">
      {/* Error message */}
      {error && <SignInError error={error} />}

      <button 
        style={{ backgroundColor: "#3b5998" }}
        onClick={() => signIn('google')}
        role="button"
      >
        <img
          className="pr-2"
          src="/images/google.svg"
          alt=""
          style={{ height: "2rem", }}
        />
        Google アカウントでログイン
      </button>

      <button
        style={{ backgroundColor: "#55acee" }}
        onClick={() => signIn('github')}
        role="button"
      >
        <img
          className="pr-2"
          src="/images/github.svg"
          alt=""
          style={{ height: "2.2rem" }}
        />
        GitHub アカウントでログイン
      </button>
    </div>
      <style jsx>{`
      .continue-with {
        margin-top: - 8em;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 100vh;
      }

      button {
        display: flex;  
        width: 22.4em;
        margin: 1em 0em;
        padding: 1em 2em;
        font-family: Inter;
        color: #fff;
        text-transform: uppercase;
        border: none;
        border-radius: 0.4em;
        line-height: 2.8em;
        text-align: center;
      }

      button:hover {
        cursor: pointer;
      }

      button img {
        margin-right: 1em;
      }
      `}</style>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return { redirect: { destination: "/" } };
  }
  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  }
}

const errors = {
  Signin: "別のアカウントでサインしてみてください",
  OAuthSignin: "別のアカウントでサインしてみてください",
  OAuthCallback: "別のアカウントでサインしてみてください",
  OAuthCreateAccount: "別のアカウントでサインしてみてください",
  EmailCreateAccount: "別のアカウントでサインしてみてください",
  Callback: "別のアカウントでサインしてみてください",
  OAuthAccountNotLinked:
    "本人であることを確認するには、最初に使用したのと同じアカウントでサインインしてください",
  EmailSignin: "メールアドレスを確認してください",
  CredentialsSignin:
    "サインインに失敗しました。入力した情報が正しいか確認してください",
  default: "サインインできません",
};
const SignInError = ({ error }) => {
  const errorMessage = error && (errors[error] ?? errors.default);
  return <div>{errorMessage}</div>;
};
