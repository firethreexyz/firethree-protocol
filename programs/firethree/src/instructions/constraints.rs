use anchor_lang::prelude::*;

use crate::Project;

pub fn is_authority_for_project(
    project: &Account<Project>,
    authority: &Signer,
) -> anchor_lang::Result<bool> {
    Ok(project.authority.eq(authority.key))
}
