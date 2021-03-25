/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import Comments from '../../components/Comments';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: {
    title: string;
    uid: string;
  };
  prevPost: {
    title: string;
    uid: string;
  };
}

export default function Post({ post, preview, nextPost, prevPost }: PostProps) {
  const route = useRouter();

  function calculateReadTime(): number {
    const arrayOfWords = post.data.content.reduce((acc, cur) => {
      const words = RichText.asText(cur.body).split(' ');
      return [...acc, ...words];
    }, []);
    const readTime = Math.ceil(arrayOfWords.length / 200);
    return readTime;
  }
  if (route.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <article>
          <h1>{post.data.title}</h1>
          <section>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                locale: ptBR,
              })}
            </time>
            <p>
              <FiUser />
              {post.data.author}
            </p>
            <p>
              <FiClock />
              {`${calculateReadTime()} min`}
            </p>
          </section>
          <small>
            {format(
              new Date(post.last_publication_date),
              "'* editado em' dd LLL yyyy', às 'HH:mm",
              {
                locale: ptBR,
              }
            )}
          </small>
          {post.data.content.map(({ heading, body }) => (
            <div key={heading}>
              <h2>{heading}</h2>
              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
              />
            </div>
          ))}
        </article>
        <div className={styles.divider} />
        <div className={styles.pagination}>
          {prevPost ? (
            <section>
              <p>{prevPost.title}</p>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </section>
          ) : (
            <section />
          )}
          {nextPost ? (
            <section>
              <p>{nextPost.title}</p>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Próximo post</a>
              </Link>
            </section>
          ) : (
            <section />
          )}
        </div>
        <Comments />
        {preview && (
          <Link href="/api/exit-preview">
            <a className={styles.previewButton}>Sair do modo Preview</a>
          </Link>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['title', 'subtitle', 'author'],
      pageSize: 1,
    }
  );
  return {
    paths: postsResponse.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextpost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const prevpost = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost =
    nextpost.results.length > 0
      ? { uid: nextpost.results[0].uid, title: nextpost.results[0].data.title }
      : null;
  const prevPost =
    prevpost.results.length > 0
      ? { uid: prevpost.results[0].uid, title: prevpost.results[0].data.title }
      : null;

  const post = {
    ...response,
  };

  return {
    props: {
      post,
      preview,
      nextPost,
      prevPost,
    },
  };
};
