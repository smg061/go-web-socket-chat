import Container from '../components/container'
import MoreStories from '../components/more-stories'
import HeroPost from '../components/hero-post'
import Intro from '../components/intro'
import Layout from '../components/layout'
import { getAllPosts } from '../lib/api'
import Head from 'next/head'
import { CMS_NAME } from '../lib/constants'
import Post from '../types/post'
import {JsonPayload, UserMessage, wsInstance} from '../lib/useWebSocket'
import Chatform from '../components/chat-form'
import { useEffect, useState } from 'react'

type Props = {
  allPosts: Post[]
}


const Index = ({ allPosts }: Props) => {
  const heroPost = allPosts[0]
  const morePosts = allPosts.slice(1)  
  const [socket] = wsInstance();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(true)

  useEffect(() => {
    if (socket) {
      socket.onopen = (e) => {
        console.log("We in boyz");
        setIsOffline(false)
      };
      socket.onclose = () => {
        console.log("connection closed");
      };
      socket.onmessage = (msg: MessageEvent<any>) => {
        console.log("running outer... ");
        const data: JsonPayload = JSON.parse(msg.data);
        switch (data.action) {
          case "list_users":
            if (data.connected_users) setUsers(data.connected_users);
            break;
          case "broadcast_server":
            console.log("running...");
            setMessages((prevState) => {
              const newState = [...prevState, data.user_message];
              return newState;
            });
            break;
          default:
            break;
        }
      };
      socket.onclose = () => {
        setIsOffline(true)
      }
    }
    return () => {
      socket!.close()
      setIsOffline(true)
    }
  }, []);

  return (
    <>
      <Layout>
        <Container>
            <Chatform socket={socket} users={users} messages={messages} isOffline={isOffline}/>
        </Container>
      </Layout>
    </>
  )
}

export default Index

export const getStaticProps = async () => {
  const allPosts = getAllPosts([
    'title',
    'date',
    'slug',
    'author',
    'coverImage',
    'excerpt',
  ])

  return {
    props: { allPosts },
  }
}
