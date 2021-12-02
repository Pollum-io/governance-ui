import { useEffect } from 'react'
import { useRouter } from 'next/router'
const Index = () => {
  const router = useRouter()

  useEffect(() => {
    const { REALM } = process.env
    const mainUrl = REALM ? `/realms/${REALM}` : '/realms'
    router.push(mainUrl)
  }, [])

  return <></>
}

export default Index
