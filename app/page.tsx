import EventCard from '@/components/EventCard'
import ExploreBtn from'@/components/ExploreBtn'
import {events} from "@/lib/constants"

interface Props {
    title : string,
    image : string,
    slug : string,
    location : string,
    date : string,
    time : string,
}

const Home = () => {
  return (
    <section>
    <h1 className='text-center'>The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
    <p className='mt-5 text-center'>Hackathons, Meetups and Conferences, All in One Place</p>

    <ExploreBtn />

    <div className='space-y-7 mt-20'> 
      <h3>Featured Event</h3>

      <ul className="events">
        {events.map((event : Props) => (
          <li key={event.title}>
            <EventCard  {...event}/>
          </li>
        ))}
      </ul>
    </div>
    </section>
  )
}

export default Home