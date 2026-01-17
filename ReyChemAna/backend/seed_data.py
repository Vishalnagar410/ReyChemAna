"""Seed data script - creates initial users and analysis types"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.request import AnalysisType
from app.core.security import get_password_hash


def create_default_users(db: Session):
    """Create default users for each role"""
    
    # Check if users already exist
    if db.query(User).count() > 0:
        print("Users already exist, skipping user creation")
        return
    
    users = [
        {
            "username": "admin",
            "email": "admin@lab.com",
            "password": "admin123",  # Change in production!
            "full_name": "System Administrator",
            "role": UserRole.ADMIN
        },
        {
            "username": "chemist1",
            "email": "chemist1@lab.com",
            "password": "chemist123",
            "full_name": "John Chemist",
            "role": UserRole.CHEMIST
        },
        {
            "username": "chemist2",
            "email": "chemist2@lab.com",
            "password": "chemist123",
            "full_name": "Jane Chemist",
            "role": UserRole.CHEMIST
        },
        {
            "username": "analyst1",
            "email": "analyst1@lab.com",
            "password": "analyst123",
            "full_name": "Bob Analyst",
            "role": UserRole.ANALYST
        },
        {
            "username": "analyst2",
            "email": "analyst2@lab.com",
            "password": "analyst123",
            "full_name": "Alice Analyst",
            "role": UserRole.ANALYST
        }
    ]
    
    for user_data in users:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            full_name=user_data["full_name"],
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        print(f"Created user: {user.username} ({user.role.value})")
    
    db.commit()
    print(f"\nCreated {len(users)} users successfully")


def create_analysis_types(db: Session):
    """Create standard analysis types"""
    
    # Check if analysis types already exist
    if db.query(AnalysisType).count() > 0:
        print("Analysis types already exist, skipping creation")
        return
    
    analysis_types = [
        {
            "code": "HPLC",
            "name": "High Performance Liquid Chromatography",
            "description": "Analytical technique for separating, identifying, and quantifying components"
        },
        {
            "code": "NMR",
            "name": "Nuclear Magnetic Resonance",
            "description": "Spectroscopic technique for determining molecular structure"
        },
        {
            "code": "LCMS",
            "name": "Liquid Chromatography-Mass Spectrometry",
            "description": "Combined analytical technique for identification and quantification"
        },
        {
            "code": "PREP_HPLC",
            "name": "Preparative HPLC",
            "description": "Large-scale purification using HPLC"
        },
        {
            "code": "GCMS",
            "name": "Gas Chromatography-Mass Spectrometry",
            "description": "Analytical method for volatile and semi-volatile compounds"
        },
        {
            "code": "IR",
            "name": "Infrared Spectroscopy",
            "description": "Identification of functional groups and molecular structure"
        },
        {
            "code": "UV_VIS",
            "name": "UV-Visible Spectroscopy",
            "description": "Quantitative analysis using light absorption"
        },
        {
            "code": "CHNS",
            "name": "Elemental Analysis (CHNS)",
            "description": "Determination of carbon, hydrogen, nitrogen, and sulfur content"
        },
        {
            "code": "TLC",
            "name": "Thin Layer Chromatography",
            "description": "Quick separation and analysis technique"
        },
        {
            "code": "MELTING_POINT",
            "name": "Melting Point Determination",
            "description": "Physical property measurement for compound identification"
        }
    ]
    
    for type_data in analysis_types:
        analysis_type = AnalysisType(
            code=type_data["code"],
            name=type_data["name"],
            description=type_data["description"],
            is_active=1
        )
        db.add(analysis_type)
        print(f"Created analysis type: {analysis_type.code}")
    
    db.commit()
    print(f"\nCreated {len(analysis_types)} analysis types successfully")


def main():
    """Main seed function"""
    print("=" * 60)
    print("LIMS Database Seed Script")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        print("\nCreating default users...")
        create_default_users(db)
        
        print("\nCreating analysis types...")
        create_analysis_types(db)
        
        print("\n" + "=" * 60)
        print("Seed completed successfully!")
        print("=" * 60)
        print("\nDefault Credentials:")
        print("  Admin:    username: admin    password: admin123")
        print("  Chemist:  username: chemist1 password: chemist123")
        print("  Analyst:  username: analyst1 password: analyst123")
        print("\n⚠️  IMPORTANT: Change default passwords in production!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
