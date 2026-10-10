import { UserRound, Mail, CalendarDays, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useApp';
export function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE, YOUR WAY</span>
          <h1>My profile</h1>
          <p>A home for the details that make you, you.</p>
        </div>
      </div>
      <section className="panel profile-panel">
        <div className="profile-banner" />
        <div className="profile-body">
          <span className="avatar large">{user.name.slice(0, 1).toUpperCase()}</span>
          <h2>{user.name}</h2>
          <p>Personal account</p>
          <dl className="profile-details">
            <div>
              <dt>
                <UserRound size={17} />
                Full name
              </dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>
                <Mail size={17} />
                Email address
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} />
                Member since
              </dt>
              <dd>
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
          <div className="profile-security">
            <ShieldCheck size={23} />
            <div>
              <strong>A space that’s just yours</strong>
              <p>Your tasks are private and linked to your account.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
