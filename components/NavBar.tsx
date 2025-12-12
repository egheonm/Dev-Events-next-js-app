import Image from "next/image"
import Link from "next/link"

const NavBar = () => {
  return (
    <header>
        <nav>
            <Link href='/' className="logo">
                <Image src="/icons/logo.png" alt="logo" height={24} width={24} />
                <p>DevEvent</p>           
            </Link>
            <ul>
                <Link href="/">Home</Link>
                <Link href="/">Event</Link>
                <Link href="/">Create Events</Link>
            </ul>
        </nav>
    </header>
  )
}

export default NavBar